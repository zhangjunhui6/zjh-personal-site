---
title: "Writing A Robot As A Verifiable Tree: URDF From Structural Modeling To Tooling"
description: A practical route for understanding, validating, and improving robot description files across links, joints, frames, URDF/Xacro, robot_state_publisher, RViz, and MoveIt.
date: 2026-05-14
tags: [Robotics, ROS, URDF, Tools]
lang: en
translationKey: robotics/ros/robot-urdf-modeling-guide
draft: false
---

URDF is easy to underestimate. Many people first meet it as a long, verbose XML file. In a robot system, though, it is a critical structural contract.

Controllers, RViz, TF, MoveIt, simulators, and hardware interfaces all need to answer the same question: what parts does this robot have, how are those parts connected, how can each joint move, and how should geometry, collision, and physical properties be understood?

URDF collects that information into a tree that the toolchain can consume.

This article does not treat URDF as a tag manual. The goal is to build a useful mental model: how to read a real project's `robot_description`, how to move from a minimal model to visual validation, and which tools take you from "it can be written" to "it can be trusted."

## Quick Understanding: URDF Solves Structural Consensus, Not Control

URDF stands for Unified Robot Description Format. It is not a control algorithm. It does not plan paths or decide where the robot should move next.

It solves structural consensus.

In a robot project, mechanical design, control, perception, planning, and simulation usually need the same structural information:

- What the base, wheels, arm, gripper, and cameras are called.
- Which part is attached to which part.
- Whether each joint is fixed, revolute, continuous, or prismatic.
- Which direction the joint axis points and what its limits are.
- What the visual model looks like and how collision geometry should be simplified.
- How mass, center of mass, and inertia should be set for simulation.

If that information is scattered across code, CAD, launch files, and verbal agreements, the system becomes hard to maintain. URDF's value is bringing it into one verifiable description that the toolchain can read.

It helps to place URDF in this chain:

```text
mechanical structure / CAD / design parameters
        |
        v
URDF / Xacro
        |
        v
robot_description
        |
        v
robot_state_publisher
        |
        v
TF tree / RViz / MoveIt / Gazebo / controllers
```

A good URDF is not only a model that appears on screen. It should let later tools keep answering three questions:

1. Which coordinate frames exist on the robot?
2. What are the parent-child relationships between those frames?
3. How should the tree update when joint states change?

## Mental Model: Links Are Nodes, Joints Are Edges

Do not begin with XML. Begin with the tree.

`link` is a node. It represents a rigid body such as `base_link`, `left_wheel_link`, `shoulder_link`, or `camera_link`. A link does not move by itself; it says "there is a part here, and this is how it can be displayed, collided with, and used in physics."

`joint` is an edge. It connects a parent link to a child link and describes where the child is mounted, which axis it moves along, and what its limits are.

A simple robot arm can be drawn like this:

```text
base_link
  -> shoulder_link
    -> upper_arm_link
      -> forearm_link
        -> wrist_link
          -> tool0
```

A differential-drive base can be read the same way:

```text
base_link
  -> left_wheel_link
  -> right_wheel_link
  -> caster_link
  -> laser_link
  -> camera_link
```

URDF robots are usually kinematic trees. Except for the root, every child link should have one parent joint. This constraint lets TF publishing, kinematics, visualization, and planning tools derive transforms stably along the tree.

Three fields matter especially:

- `origin`: the position and orientation of a joint or geometry element relative to its parent frame.
- `axis`: the joint motion axis, defined in the joint frame.
- `limit`: range, velocity, and effort limits, commonly used by `revolute` and `prismatic` joints.

Many URDF problems are not XML errors. They are confusions between these concepts. A joint's `origin` decides where the child link is attached. A `visual` `origin` only decides where the appearance is placed. The `axis` must be interpreted in the joint coordinate frame.

## A Minimal URDF

Start with a small model that still has motion:

```xml
<?xml version="1.0"?>
<robot name="simple_arm">
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.4 0.4 0.1"/>
      </geometry>
      <material name="base_gray">
        <color rgba="0.2 0.2 0.2 1"/>
      </material>
    </visual>
  </link>

  <link name="arm_link">
    <visual>
      <origin xyz="0 0 0.25" rpy="0 0 0"/>
      <geometry>
        <cylinder length="0.5" radius="0.04"/>
      </geometry>
      <material name="arm_blue">
        <color rgba="0.1 0.3 0.9 1"/>
      </material>
    </visual>
  </link>

  <joint name="base_to_arm" type="revolute">
    <parent link="base_link"/>
    <child link="arm_link"/>
    <origin xyz="0 0 0.1" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-1.57" upper="1.57" effort="20" velocity="1.5"/>
  </joint>
</robot>
```

The structure is small but meaningful:

| Fragment | Meaning |
| --- | --- |
| `<robot name="simple_arm">` | Defines the robot model root and name |
| `<link name="base_link">` | Defines a rigid body, often the root frame |
| `<visual>` | Describes how the link is displayed |
| `<geometry>` | Uses box, cylinder, sphere, or mesh geometry |
| `<joint type="revolute">` | Defines a bounded rotating joint |
| `<parent>` / `<child>` | Defines the tree relationship |
| `<origin xyz="0 0 0.1">` | Places the joint frame relative to the parent link |
| `<axis xyz="0 0 1">` | Rotates around the z axis |
| `<limit>` | Sets angle, effort, and velocity limits |

This is not yet a real robot, but it already contains the key engineering structure: two rigid bodies, one joint, and a derivable parent-child relationship.

If you can first translate any URDF into a tree like this, the visual, collision, inertia, and tool configuration become much easier to understand.

## From Minimal Model To Visual Validation

The key to learning URDF is not writing a complete model at once. It is making every step verifiable.

First, write only the structure. Let links and joints form a tree before adding meshes or complex inertia.

```text
base_link
  -> arm_link
```

Second, run static checks. If `urdfdom` tools are available:

```bash
check_urdf simple_arm.urdf
urdf_to_graphiz simple_arm.urdf
```

`check_urdf` catches XML, tree structure, and URDF parsing errors. `urdf_to_graphiz` exports the link/joint graph, which is often easier than staring at XML when parent/child links are reversed or disconnected.

Third, put the model into ROS as `robot_description`. In ROS 2, many tools read the `robot_description` parameter or topic rather than a raw file path.

Fourth, use `robot_state_publisher` to generate TF. It reads the robot model, combines it with `/joint_states`, and publishes the kinematic tree as `/tf` and `/tf_static`.

Fifth, inspect the result in RViz. RViz is not only a final display tool; it is the first debugging surface for URDF. Incorrect model position, wrong joint direction, bad Fixed Frame selection, or broken TF trees show up quickly.

A healthy validation loop looks like this:

```text
make a small edit
  -> check_urdf
  -> inspect the link/joint graph
  -> start robot_state_publisher
  -> move joints with joint_state_publisher_gui
  -> inspect the model and TF in RViz
```

This keeps failures small. You do not wait until MoveIt or Gazebo breaks before guessing whether the problem is `axis`, `origin`, a mesh path, or inertia.

## Reading Real URDF/Xacro Projects

Real projects rarely maintain one giant plain `.urdf` file for long. More often there is a `description` package containing URDF, Xacro, meshes, RViz config, and launch files.

A typical structure might be:

```text
my_robot_description/
  urdf/
    my_robot.urdf.xacro
    base.xacro
    arm.xacro
    sensors.xacro
  meshes/
    visual/
    collision/
  launch/
    display.launch.py
  rviz/
    urdf_preview.rviz
```

Read this kind of project in layers.

First, find the entry file, often `my_robot.urdf.xacro`. It includes other Xacro files and assembles the full robot. Find the root link and top-level macro calls before diving into every mesh.

Second, inspect names. A good model keeps part names, joint names, and frame names stable: `base_link`, `shoulder_pan_joint`, `wrist_roll_link`. Names such as `link_1`, `joint_new`, and `part_final` make later debugging painful.

Third, inspect paths. Meshes often use:

```xml
<mesh filename="package://my_robot_description/meshes/visual/base.stl"/>
```

`package://` means the resource path is resolved from a ROS package. If a model displays on your machine but not in CI, a teammate environment, or a container, the package name, install rules, or mesh path are often the cause.

Fourth, inspect Xacro. Xacro is for reuse and parameterization, not for making XML mysterious. Wheels, repeated joints, and sensor mounts are good macro candidates:

```xml
<xacro:macro name="wheel" params="name x y">
  <link name="${name}_wheel_link">
    <visual>
      <origin xyz="0 0 0" rpy="1.5708 0 0"/>
      <geometry>
        <cylinder radius="0.08" length="0.04"/>
      </geometry>
    </visual>
  </link>

  <joint name="${name}_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="${name}_wheel_link"/>
    <origin xyz="${x} ${y} 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>
</xacro:macro>
```

Good Xacro makes repeated structure clearer. Bad Xacro mixes coordinates, names, conditionals, and nested macros until the generated URDF is hard to trace. In complex projects, expand Xacro first and read the final URDF:

```bash
xacro my_robot.urdf.xacro > /tmp/my_robot.urdf
check_urdf /tmp/my_robot.urdf
```

## Toolchain Map

URDF is not isolated. It becomes valuable inside the toolchain.

| Tool | Problem it solves | What to confirm |
| --- | --- | --- |
| URDF | Describes robot structure | `link`, `joint`, `origin`, `axis`, and `limit` are correct |
| Xacro | Reuses and parameterizes URDF | Repeated structures generate stable, readable URDF |
| `check_urdf` | Parsing and structure check | XML is valid and the tree is connected |
| `urdf_to_graphiz` | Generates link/joint graph | Parent-child relationships match the mechanical structure |
| `robot_state_publisher` | Converts URDF + joint states into TF | `/tf` and `/tf_static` are complete |
| `joint_state_publisher` / GUI | Publishes test joint states | Joint directions and ranges are reasonable |
| RViz | Visualizes model and TF | Model displays correctly and Fixed Frame is connected |
| MoveIt Setup Assistant | Generates planning configuration | Planning groups, end effectors, and self-collision matrix are reasonable |
| Gazebo / simulator | Validates physical behavior | Collision, inertial, and control interfaces are believable |

Use the map to decide where to debug.

- If the model does not show in RViz, check `robot_description`, mesh paths, and Fixed Frame.
- If the model shows but joints do not move, check `/joint_states` and `robot_state_publisher`.
- If a joint moves the wrong way, check the joint `origin` and `axis`.
- If MoveIt plans strangely, check collision models, joint limits, planning groups, and the self-collision matrix.
- If simulation shakes or explodes, inspect inertial values, overlapping collision geometry, and control interfaces.

The point is not to run more commands. The point is knowing which layer of truth each tool validates.

## Visual, Collision, Inertial

Many models display in RViz but fail in planning or simulation because `visual`, `collision`, and `inertial` are blurred together.

`visual` is for people. It can use detailed meshes that look like the real robot.

`collision` is for collision checking and planning. It should be simple, stable, and cheap to compute. A detailed visual shell may become a few boxes or cylinders for collision.

`inertial` is for physics. It describes mass, center of mass, and inertia matrix. Simulators, dynamics, and controllers depend on it.

A common strategy:

```text
visual:    close to the real appearance, useful for debugging and presentation
collision: simplified, preserving safety boundary and main shape
inertial:  calculated from CAD or approximate geometry, not filled with zeros casually
```

Do not copy visual meshes directly into collision and expect MoveIt and simulation to stay stable. Do not treat mass and inertia as decorative fields. If the three are mixed, debugging becomes much harder.

## Growth Path

If you only want to write a basic URDF, learn `link`, `joint`, `origin`, `axis`, `limit`, and `visual`.

If you want to use URDF reliably in engineering, go further:

1. Read models: find the entry Xacro, expand the final URDF, and draw the tree from root link to end effector.
2. Validate models: use `check_urdf`, `urdf_to_graphiz`, RViz, TF, and `joint_state_publisher_gui` layer by layer.
3. Maintain Xacro: know which repeated structures deserve macros and which parameters should be centralized.
4. Serve planning: understand why MoveIt needs URDF and how SRDF adds planning groups, end effectors, virtual joints, and self-collision semantics.
5. Reach simulation and hardware boundaries: know that Gazebo, `ros2_control`, and controller config are not URDF itself, but depend on links, joints, transmissions, collision, and inertia.

Expertise is not memorizing every tag. It is judging whether a model is trustworthy for each consumer:

- For RViz: is the frame tree complete and the visual model explanatory?
- For MoveIt: are collision models and joint limits suitable for planning?
- For Gazebo: are inertia, collision, and control interfaces physically credible?
- For control: do joint names, state interfaces, and command interfaces match?

At that point URDF stops being an XML file and becomes the structural entry point of the robot software system.

## Troubleshooting Checklist

### Model Flies Away Or Collapses At The Origin

Check `origin` and units first. URDF lengths are usually meters and angles are radians. CAD meshes exported in millimeters can look absurd if URDF interprets them as meters.

### Joint Direction Is Reversed

Check `axis`, then the joint `origin rpy`. The `axis` is defined in the joint frame, not always in the world frame.

### Model Does Not Show In RViz

Check whether `robot_description` was published or passed correctly. Then check whether Fixed Frame names an existing connected frame. If meshes are missing, inspect `package://` paths, install rules, and file formats.

### TF Is Missing Or Broken

Check whether `robot_state_publisher` is running and whether `/joint_states` contains the expected joint names. Fixed joints usually go to `/tf_static`; moving joints need joint state updates before they enter `/tf`.

### MoveIt Loads But Plans Poorly

Inspect joint limits, planning groups, end effectors, and the self-collision matrix. MoveIt Setup Assistant can generate a default self-collision matrix, but you still need to understand which link pairs were disabled and which collisions must remain.

### Simulation Shakes Or Explodes

Check overlapping collision geometry, plausible inertia, and realistic mass. A correct visual model does not guarantee a correct physical model.

### Xacro Expands To Duplicate Names

Check whether macro parameters are actually used in link and joint names. Duplicate names make URDF parsing and tool behavior unpredictable.

## Commands I Would Keep Nearby

```bash
# Expand Xacro
xacro my_robot.urdf.xacro > /tmp/my_robot.urdf

# Check URDF structure
check_urdf /tmp/my_robot.urdf

# Generate a link/joint graph
urdf_to_graphiz /tmp/my_robot.urdf

# Inspect robot description and TF in ROS 2
ros2 topic echo /robot_description
ros2 topic echo /joint_states
ros2 topic echo /tf_static
ros2 run tf2_tools view_frames

# Start MoveIt Setup Assistant
ros2 launch moveit_setup_assistant setup_assistant.launch.py
```

The commands are not the point. The point is knowing what each command validates: whether the file parses, whether the tree is connected, whether joint states arrive, whether TF is published, and whether planning semantics are complete.

## Final Thought

URDF has a clear learning path:

- See the robot as a tree made of links and joints.
- Treat `origin`, `axis`, and `limit` as geometric constraints on every edge.
- Use `visual`, `collision`, and `inertial` for display, planning, and physics.
- Hand the model to `robot_state_publisher`, RViz, MoveIt, and simulation for layered validation.

A good URDF is not merely openable, error-free, and visible. It should let downstream tools trust the same thing: what the robot is, where it is, how it can move, and within which boundaries that motion is reasonable.

## References

- [ROS 2 URDF tutorial entry](https://docs.ros.org/en/rolling/Tutorials/Intermediate/URDF/URDF-Main.html)
- [ROS 2: Using Xacro to clean up your code](https://docs.ros.org/en/rolling/Tutorials/Intermediate/URDF/Using-Xacro-to-Clean-Up-a-URDF-File.html)
- [ros/robot_state_publisher](https://github.com/ros/robot_state_publisher)
- [joint_state_publisher documentation](https://docs.ros.org/en/jazzy/p/joint_state_publisher/)
- [MoveIt Setup Assistant](https://moveit.picknik.ai/main/doc/examples/setup_assistant/setup_assistant_tutorial.html)
