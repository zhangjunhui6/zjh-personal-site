---
title: 把环境装进箱子：Docker 的日常开发指南
description: 从镜像、容器、Dockerfile 到 Compose 和数据持久化，整理一份日常开发里真正用得上的 Docker 工作流。
date: 2026-05-14
tags: [Docker, 开发流程, 工具]
lang: zh
translationKey: software/devops/docker-daily-development-guide
draft: false
---

Docker 最常见的价值，不是让人显得更“云原生”，而是把那句古老的“我机器上明明可以跑”变少一点。

它把应用运行所需的系统依赖、语言运行时、启动命令和部分配置打包到一个可复制的环境里。这样你在本地、同事电脑、CI、测试环境里运行的东西，至少有机会站在同一条起跑线上。

这篇文章先不碰 Kubernetes，也不急着谈复杂部署。我们只回答日常开发里最常遇到的问题：

- Docker 到底在管理什么。
- 镜像、容器、Dockerfile、Compose 分别是什么。
- 常用命令适合哪些场景。
- 本地开发和团队协作里怎样少踩坑。

## Docker 解决的是什么问题

传统开发环境里，应用往往依赖很多本机状态：Node、Python、Java、数据库、系统库、环境变量、端口、配置文件。只要其中一处不一致，项目就可能在一个人机器上能跑，在另一个人机器上炸掉。

Docker 的思路是：不要只交付代码，也交付一份可重复创建的运行环境。

容器不是一台完整虚拟机。你可以把它理解成一个隔离的进程，它带着自己需要的文件系统、运行时和默认启动命令，同时和宿主机共享内核。因为它比虚拟机轻，所以很适合本地开发、CI 测试和应用交付。

## 先分清几个核心概念

### 镜像

镜像是一个只读模板，里面包含运行应用所需的文件、依赖和默认配置。比如 `node:22-alpine`、`postgres:16-alpine`、`nginx:alpine` 都是镜像。

你可以把镜像看成“打包好的运行材料”。它本身不会跑，真正跑起来的是容器。

### 容器

容器是镜像运行后的实例。一个镜像可以启动很多个容器，就像一个类可以创建很多个对象。

```bash
docker run --rm -p 8080:80 nginx:alpine
```

这条命令会用 `nginx:alpine` 镜像启动一个容器，把容器里的 `80` 端口映射到本机的 `8080` 端口。打开 `http://localhost:8080`，访问到的就是容器里的 Nginx。

### Dockerfile

Dockerfile 是构建镜像的说明书。它告诉 Docker：从哪个基础镜像开始，复制哪些文件，安装哪些依赖，最后容器启动时执行什么命令。

一个极简 Node 应用 Dockerfile 可能长这样：

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

这不是最终最佳实践，但它能表达基本流程：选基础镜像、设置工作目录、安装依赖、复制代码、声明端口、定义启动命令。

### Registry

Registry 是存放镜像的地方。Docker Hub、GitHub Container Registry、私有镜像仓库都属于这一类。

常见动作是：

```bash
docker pull nginx:alpine
docker tag my-app:latest ghcr.io/example/my-app:latest
docker push ghcr.io/example/my-app:latest
```

本地构建出来的镜像只在你机器上。要给 CI、测试环境或服务器使用，就需要推到某个 registry。

### Volume

容器本身应该尽量是可删除、可重建的。问题是数据库数据、上传文件、缓存这类内容不能随着容器删除一起消失，这就需要 volume。

```bash
docker volume create pg_data
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -v pg_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

容器删掉后，`pg_data` 这个 volume 还在。下次重新启动数据库容器，数据可以继续挂载回来。

### Compose

单个容器用 `docker run` 还能接受；一旦项目里有 Web、API、数据库、Redis、消息队列，手敲命令就会很快失控。

Docker Compose 用一个 `compose.yaml` 描述多容器应用：

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

然后一条命令启动整套本地环境：

```bash
docker compose up -d
```

这就是 Compose 在日常开发里的价值：把“项目怎么跑起来”写进仓库，而不是散落在每个人的聊天记录和记忆里。

## 常用命令和场景

### 看 Docker 是否可用

```bash
docker version
docker info
```

`docker version` 看客户端和服务端版本；`docker info` 看当前 Docker Engine、镜像、容器、存储驱动等状态。遇到 Docker Desktop 没启动、daemon 连不上时，这两个命令很快能暴露问题。

### 启动一个临时容器

```bash
docker run --rm -it ubuntu:24.04 bash
```

这里几个参数很常用：

- `--rm`：容器退出后自动删除。
- `-it`：进入交互式终端。
- `ubuntu:24.04`：镜像名和 tag。
- `bash`：覆盖默认启动命令。

这种方式适合临时验证 Linux 命令、系统包、网络连通性，或者快速进入一个干净环境。

### 后台运行服务

```bash
docker run -d \
  --name web \
  -p 8080:80 \
  nginx:alpine
```

常用参数：

- `-d`：后台运行。
- `--name`：给容器起名，后面操作更方便。
- `-p 8080:80`：本机端口 8080 映射到容器端口 80。

端口映射最容易记反。规则是：`宿主机端口:容器端口`。

### 查看、进入和停止容器

```bash
docker ps
docker ps -a
docker logs -f web
docker exec -it web sh
docker stop web
docker rm web
```

`docker ps` 只看运行中的容器；`docker ps -a` 包括已经退出的容器。`logs` 看日志，`exec` 进入正在运行的容器，`stop` 停止，`rm` 删除。

如果你发现本机端口被占用，先看是不是某个旧容器还活着。

### 构建镜像

```bash
docker build -t my-app:dev .
```

最后的 `.` 是 build context，表示 Docker 会把当前目录作为构建上下文发送给构建器。这里很容易踩坑：如果没有 `.dockerignore`，`node_modules`、日志、测试截图、临时文件都可能进入上下文，让构建变慢，也让镜像层变脏。

常见 `.dockerignore`：

```text
node_modules
dist
.git
.env
log
*.log
```

`.env` 一般不应该被复制进镜像。真正的密钥和环境差异，应该在运行时注入。

### 清理不用的资源

```bash
docker image ls
docker container ls -a
docker volume ls
docker system df
docker system prune
```

`prune` 很有用，但也要小心。它会删除未使用的资源。清 volume 前尤其要确认，因为那里可能有数据库数据。

```bash
docker volume prune
```

这条命令不要闭眼执行。

### 使用 Compose 管理本地环境

```bash
docker compose up -d
docker compose logs -f
docker compose exec app sh
docker compose down
docker compose down --volumes
```

`down` 会删除 Compose 创建的容器和网络，但默认不会删除 named volumes。加上 `--volumes` 才会把 volume 也删掉。这对重置本地数据库很方便，但也意味着数据会消失。

## Dockerfile 怎么写得更像生产可用

### 使用多阶段构建

多阶段构建可以把“构建环境”和“运行环境”分开。前一阶段安装依赖、编译代码，后一阶段只拿运行需要的产物。

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

它的核心不是“写得高级”，而是避免把编译工具、开发依赖和中间文件带进最终镜像。

### 让缓存帮你省时间

Docker 构建是分层缓存的。Dockerfile 里越靠前的步骤越容易影响后续缓存，所以一般先复制依赖清单，再安装依赖，最后复制业务代码：

```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
```

这样只改业务代码时，依赖安装层可以复用。

### 不要把镜像当垃圾桶

镜像里不要放不需要的东西：

- 不需要的系统包。
- 本地日志。
- `.git` 目录。
- 测试产物。
- 密钥、token、私有证书。

镜像越小，构建越快，传输越快，攻击面也越小。

### 容器尽量保持短命、可替换

容器不应该是需要手工进去“修一修”的小服务器。更健康的方式是：配置通过环境变量和挂载传入，数据放在 volume 或外部服务，容器本身可以随时删掉重建。

如果你需要经常 `docker exec` 进去改文件，通常说明镜像或配置方式需要调整。

## 日常开发工作流

一个比较舒服的本地 Docker 工作流可以是这样：

```bash
# 第一次进入项目
docker compose up -d --build

# 看日志
docker compose logs -f app

# 进入应用容器排查问题
docker compose exec app sh

# 改了 Dockerfile 或依赖
docker compose build app
docker compose up -d

# 停止本地环境
docker compose down
```

如果只是改业务代码，是否需要 rebuild 取决于你的开发模式：

- 如果代码通过 bind mount 挂进容器，通常不用 rebuild。
- 如果代码被 COPY 进镜像，就需要重新 build。
- 如果改了 `package.json`、`requirements.txt`、`pom.xml` 这类依赖清单，通常需要 rebuild。

## 常见坑

### 端口映射写反

`-p 8080:80` 是本机 `8080` 到容器 `80`。如果容器里应用监听的是 `3000`，那就应该写：

```bash
docker run -p 3000:3000 my-app:dev
```

### 数据写在容器层里

容器删除后，容器自己的可写层也会消失。数据库、本地上传文件、开发缓存要用 volume 或外部服务承接。

### 把 `latest` 当成确定版本

`latest` 不是“最新且安全”的承诺，它只是一个 tag。团队协作和生产镜像最好使用明确版本，比如：

```dockerfile
FROM node:22-alpine
```

是否要 pin 到 digest，取决于你对可复现和安全更新的要求。至少不要在关键环境里完全依赖模糊 tag。

### 在镜像里放密钥

不要在 Dockerfile 里写：

```dockerfile
ENV API_TOKEN=...
```

镜像层会留下历史。密钥应该通过运行时环境变量、secret 管理系统或部署平台注入。

### Compose 文件越写越像生产编排

Compose 很适合本地开发和简单部署，但它不是 Kubernetes 的低配替代品。不要把所有生产复杂度都塞进本地 `compose.yaml`。本地文件的目标应该是让开发者可靠启动依赖，而不是模拟整个生产世界。

## 我会保留的一组命令

如果只记一组命令，我会记这些：

```bash
docker ps
docker ps -a
docker logs -f <container>
docker exec -it <container> sh
docker build -t <image>:<tag> .
docker run --rm -it <image> sh
docker stop <container>
docker rm <container>

docker compose up -d --build
docker compose logs -f
docker compose exec <service> sh
docker compose down
```

这些命令足够覆盖 80% 的日常开发排查。

## 最后

Docker 用得好，不是把所有东西都塞进容器，也不是为了容器化而容器化。

它真正适合解决的是环境一致性、依赖隔离、服务编排和交付可重复性。一个好的 Docker 工作流，应该让新人更快跑起项目，让 CI 更接近真实运行环境，让生产镜像更小、更明确、更容易替换。

当你能清楚地区分镜像和容器、构建和运行、临时文件和持久数据、Dockerfile 和 Compose，Docker 就不再是一组神秘命令，而会变成日常开发里很可靠的一层地板。

## 参考资料

- [Docker Docs: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)
- [Docker Docs: What is an image?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/)
- [Docker Docs: What is a registry?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-registry/)
- [Docker Docs: Writing a Dockerfile](https://docs.docker.com/get-started/docker-concepts/building-images/writing-a-dockerfile/)
- [Docker Docs: Multi-stage builds](https://docs.docker.com/get-started/docker-concepts/building-images/multi-stage-builds/)
- [Docker Docs: Building best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker Docs: What is Docker Compose?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-docker-compose/)
- [Docker Docs: Volumes](https://docs.docker.com/engine/storage/volumes/)
