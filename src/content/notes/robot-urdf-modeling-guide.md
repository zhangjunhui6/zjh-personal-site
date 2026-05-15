---
title: 把机器人写成一棵树：URDF 的建模入门
description: 从 link、joint、visual、collision 和 inertial 开始，理解 URDF 如何描述一个机器人的结构。
date: 2026-05-14
tags: [机器人, ROS, URDF, 工具]
lang: zh
draft: false
---

URDF 很容易被误会成“ROS 里才用得上的配置文件”。更准确地说，它是一种用 XML 描述机器人结构的格式：哪些部件存在，部件之间怎样连接，每个部件长什么样、碰撞体是什么、质量和惯量如何设置。

本地不需要先安装 ROS 2 才能学习 URDF。你完全可以从一个普通 XML 文件开始，把机器人拆成 link 和 joint，再逐步补上可视化、碰撞和惯性信息。ROS 2、RViz、Gazebo 这类工具会让验证和展示更方便，但核心建模思路不依赖这些工具。

## URDF 是什么

URDF 的全称是 Unified Robot Description Format。它不是用来写控制逻辑的，也不是用来描述任务流程的；它主要回答一个问题：这个机器人由哪些刚体组成，这些刚体之间通过什么关节连接。

一个最小的 URDF 文件通常从 `<robot>` 根节点开始，里面包含一组 `<link>` 和 `<joint>`：

```xml
<robot name="simple_arm">
  <link name="base_link" />
  <link name="arm_link" />

  <joint name="base_to_arm" type="revolute">
    <parent link="base_link" />
    <child link="arm_link" />
    <origin xyz="0 0 0.2" rpy="0 0 0" />
    <axis xyz="0 0 1" />
    <limit lower="-1.57" upper="1.57" effort="5" velocity="1" />
  </joint>
</robot>
```

这个例子还没有几何外观，也没有质量信息，但它已经表达了最核心的结构：`arm_link` 通过一个旋转关节接在 `base_link` 上。

## Link 和 joint：把机器人拆成一棵树

URDF 的建模方式很像把机器人写成一棵树。

`link` 是树上的节点，可以理解成机器人里的一个刚体，比如底座、机械臂的一节、轮子、夹爪外壳。一个 link 自身不描述它怎样运动，只描述“有这么一个部件”。

`joint` 是节点之间的边，用来描述父 link 和子 link 如何连接。常见 joint 类型包括：

- `fixed`：固定连接，两个 link 之间没有相对运动。
- `revolute`：有上下限的旋转关节，机械臂关节很常见。
- `continuous`：没有角度上下限的旋转关节，比如可以持续转动的轮子。
- `prismatic`：直线滑动关节，比如升降结构或滑轨。

URDF 要求结构是一棵树。一个 child link 只能有一个 parent joint。这个限制会让模型更清楚，也方便机器人状态发布、运动学计算和可视化工具理解整机结构。

写 URDF 时，我会先只搭树，不急着写几何体：

```text
base_link
  -> shoulder_link
    -> elbow_link
      -> wrist_link
        -> gripper_link
```

如果这棵树讲不清楚，后面的 mesh、碰撞体和惯量只会把问题藏得更深。

## Visual、collision、inertial 不要混在一起

一个 link 里经常会出现三类信息：`visual`、`collision`、`inertial`。它们看起来都和形状有关，但用途完全不同。

`visual` 负责显示。你在 RViz 或仿真器里看到的模型，主要来自这里。它可以使用 box、cylinder、sphere 这类简单几何体，也可以引用外部 mesh 文件。

```xml
<visual>
  <geometry>
    <box size="0.4 0.2 0.1" />
  </geometry>
  <material name="matte_green">
    <color rgba="0.2 0.5 0.4 1" />
  </material>
</visual>
```

`collision` 负责碰撞计算。它最好比 visual 更简单。一个很精细的外观 mesh 适合展示，但不一定适合碰撞检测。真实项目里，collision 通常会用更粗略的 box、cylinder 或简化 mesh。

```xml
<collision>
  <geometry>
    <box size="0.42 0.22 0.12" />
  </geometry>
</collision>
```

`inertial` 负责物理属性，包括质量、质心位置和惯性矩阵。只做静态可视化时它可能暂时不明显；一旦进入仿真或动力学相关工具，错误的 inertial 会让模型出现抖动、飞走或运动异常。

```xml
<inertial>
  <mass value="1.2" />
  <origin xyz="0 0 0" rpy="0 0 0" />
  <inertia ixx="0.02" ixy="0" ixz="0" iyy="0.02" iyz="0" izz="0.03" />
</inertial>
```

一个实用原则是：visual 为人服务，collision 为计算服务，inertial 为物理服务。三者可以长得像，但不要默认它们应该完全一样。

## 没有 ROS 2 环境时怎么学习 URDF

本地不装 ROS 2，也可以先按这条路径学习：

1. 用普通编辑器写一个最小 URDF，只包含 `<robot>`、两个 `<link>` 和一个 `<joint>`。
2. 用 XML 格式化工具确保标签闭合、缩进清楚。
3. 先把 link 和 joint 的树结构画出来，确认 parent 和 child 没有反。
4. 再给每个 link 补 visual，优先用 box、cylinder、sphere 这类简单几何体。
5. 最后补 collision 和 inertial，不要一开始就把全部细节塞进去。

等结构熟悉以后，再接 ROS 2 工具链会轻松很多。你会知道工具报错是在说 XML 语法、坐标系、关节限制，还是物理参数。

官方教程可以从 ROS 2 文档的 URDF 章节开始：<https://docs.ros.org/en/rolling/Tutorials/Intermediate/URDF/URDF-Main.html>。

## 日常建模时的几个习惯

先命名，再建模。`base_link`、`left_wheel_link`、`camera_link` 这种名字虽然朴素，但比 `link1`、`part_new_2` 更容易维护。

先树结构，再外观。很多 URDF 问题不是 mesh 不漂亮，而是 parent/child 反了、origin 放错了、坐标轴方向没想清楚。

坐标系要小步验证。每加一个 joint，就确认一次 `origin` 和 `axis`。不要等几十个 link 都写完再一起调。

collision 尽量简单。能用一个 box 表达的碰撞体，就不要一上来塞复杂 mesh。仿真和规划更关心稳定、快速、近似正确。

inertial 不要瞎填。暂时不知道准确惯量时，可以先承认它是占位参数，并在文章或注释里标出来。错误的物理参数比缺参数更难排查。

## 一个最小检查清单

写完一段 URDF，我通常会过一遍这个清单：

- 每个 link 名字是否唯一。
- 每个 joint 名字是否唯一。
- 除根 link 外，每个 child link 是否只有一个 parent。
- joint 的 `origin` 是否表达了子坐标系相对父坐标系的位置。
- revolute 和 prismatic joint 是否有合理的 `limit`。
- visual、collision、inertial 是否分别服务自己的目的。
- mesh 路径是否稳定，换机器后是否还能找到。

URDF 入门的关键不是背完所有标签，而是先建立一个清楚的心智模型：机器人是一棵由 link 和 joint 组成的树；显示、碰撞和物理参数是同一棵树上的不同层信息。这个模型想清楚以后，后面的工具链才会变得顺手。
