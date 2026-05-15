---
title: "Put The Environment In A Box: A Practical Docker Guide"
description: A daily Docker workflow covering images, containers, Dockerfile, Compose, persistence, and the commands that matter in real development.
date: 2026-05-14
tags: [Docker, Development Workflow, Tools]
lang: en
translationKey: software/devops/docker-daily-development-guide
draft: false
---

Docker's most common value is not making a project sound "cloud native." It is reducing the old sentence: "but it works on my machine."

Docker packages the system dependencies, language runtime, startup command, and part of the configuration an application needs into a reproducible environment. That gives your machine, a teammate's machine, CI, and staging at least a chance to start from the same baseline.

This guide does not start with Kubernetes or complex deployment. It focuses on the daily development questions:

- What is Docker actually managing?
- What are images, containers, Dockerfile, Compose, and volumes?
- Which commands matter in common situations?
- How can local development and team collaboration avoid common traps?

## What Problem Docker Solves

Traditional development environments often depend on a lot of local state: Node, Python, Java, databases, system libraries, environment variables, ports, and configuration files. If one piece differs, a project can run on one machine and fail on another.

Docker's idea is simple: do not only ship code; ship a repeatable runtime environment.

A container is not a full virtual machine. It is better understood as an isolated process with its own filesystem, runtime, and default command, while sharing the host kernel. Because it is lighter than a virtual machine, it fits local development, CI tests, and application delivery well.

## Core Concepts

### Image

An image is a read-only template containing the files, dependencies, and default configuration needed to run something. Examples include `node:22-alpine`, `postgres:16-alpine`, and `nginx:alpine`.

The image itself does not run. A container runs from an image.

### Container

A container is a running instance of an image. One image can start many containers, just as one class can create many objects.

```bash
docker run --rm -p 8080:80 nginx:alpine
```

This starts an `nginx:alpine` container and maps port `80` inside the container to port `8080` on the host. Open `http://localhost:8080` and you reach Nginx inside the container.

### Dockerfile

A Dockerfile is the recipe for building an image. It tells Docker which base image to use, which files to copy, which dependencies to install, and which command the container should run.

A minimal Node Dockerfile might look like this:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

This is not a final best practice, but it shows the basic flow: choose a base image, set a working directory, install dependencies, copy code, declare a port, and define the startup command.

### Registry

A registry stores images. Docker Hub, GitHub Container Registry, and private registries all fit this role.

Common actions:

```bash
docker pull nginx:alpine
docker tag my-app:latest ghcr.io/example/my-app:latest
docker push ghcr.io/example/my-app:latest
```

An image built locally only exists on your machine. If CI, staging, or a server needs it, push it to a registry.

### Volume

Containers should usually be disposable. But database data, uploaded files, and caches cannot disappear every time a container is removed. That is what volumes are for.

```bash
docker volume create pg_data
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -v pg_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

If the container is removed, the `pg_data` volume remains. The next database container can mount the same data again.

### Compose

Single containers can be managed with `docker run`. Once a project has a web app, API, database, Redis, and queue, hand-written commands get messy quickly.

Docker Compose describes a multi-container application in `compose.yaml`:

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

Then one command starts the local stack:

```bash
docker compose up -d
```

This is the everyday value of Compose: "how to run the project" lives in the repository, not scattered through chat messages and memory.

## Common Commands And Situations

### Check Whether Docker Works

```bash
docker version
docker info
```

`docker version` shows client and server versions. `docker info` shows the current engine state, images, containers, storage driver, and more. When Docker Desktop is not running or the daemon cannot be reached, these commands reveal it quickly.

### Start A Temporary Container

```bash
docker run --rm -it ubuntu:24.04 bash
```

Useful flags:

- `--rm`: remove the container after it exits.
- `-it`: open an interactive terminal.
- `ubuntu:24.04`: image name and tag.
- `bash`: override the default command.

This is useful for checking Linux commands, packages, network access, or a clean environment.

### Run A Service In The Background

```bash
docker run -d \
  --name web \
  -p 8080:80 \
  nginx:alpine
```

Common flags:

- `-d`: run in the background.
- `--name`: give the container a stable name.
- `-p 8080:80`: map host port 8080 to container port 80.

Port mapping is easy to reverse by mistake. The rule is `host:container`.

### Inspect, Enter, And Stop Containers

```bash
docker ps
docker ps -a
docker logs -f web
docker exec -it web sh
docker stop web
docker rm web
```

`docker ps` shows running containers. `docker ps -a` includes exited containers. `logs` reads logs, `exec` enters a running container, `stop` stops it, and `rm` removes it.

If a local port is occupied, first check whether an old container is still alive.

### Build Images

```bash
docker build -t my-app:dev .
```

The final `.` is the build context. Docker sends that directory to the builder. Without a `.dockerignore`, `node_modules`, build output, logs, screenshots, and temporary files can enter the context, making builds slow and images messy.

A common `.dockerignore`:

```text
node_modules
dist
.git
.env
log
*.log
```

`.env` files generally should not be copied into images. Secrets and environment differences should be injected at runtime.

### Clean Unused Resources

```bash
docker image ls
docker container ls -a
docker volume ls
docker system df
docker system prune
```

Be careful with cleanup. Images and stopped containers are usually safe to recreate. Volumes may contain data you care about.

## Development Habits That Help Teams

Docker is most useful when it captures team agreements:

- Put repeatable startup commands into Compose.
- Keep `.dockerignore` current.
- Do not bake local secrets into images.
- Use clear image tags for development and release builds.
- Document which commands are local-only and which need CI or GPU machines.
- Treat volumes as stateful resources, not disposable files.

The goal is not to containerize everything for its own sake. The goal is to make the environment explicit enough that failures become diagnosable.

## Final Thought

Docker is not magic. It does not remove all environment problems. But it gives a project a written, reproducible boundary around runtime assumptions. Once that boundary is clear, local development, CI, and deployment become easier to discuss and easier to repair.
