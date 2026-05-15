import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  featuredProjects,
  isPublished,
  newestFirst,
  notesByPinnedThenNewest,
} from '../src/utils/collections.ts';

const entry = (id, data) => ({ id, data });

describe('collection helpers', () => {
  it('filters draft entries from public collections', () => {
    assert.equal(isPublished(entry('public', { draft: false, date: new Date('2026-05-12') })), true);
    assert.equal(isPublished(entry('draft', { draft: true, date: new Date('2026-05-12') })), false);
  });

  it('sorts dated entries newest first and then by id', () => {
    const sorted = newestFirst([
      entry('b', { date: new Date('2026-05-10') }),
      entry('c', { date: new Date('2026-05-12') }),
      entry('a', { date: new Date('2026-05-12') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), ['a', 'c', 'b']);
  });

  it('sorts notes with pinned entries first before date and id', () => {
    const sorted = notesByPinnedThenNewest([
      entry('old-pinned', { pinned: true, date: new Date('2026-05-10') }),
      entry('new-unpinned', { pinned: false, date: new Date('2026-05-13') }),
      entry('new-pinned-b', { pinned: true, date: new Date('2026-05-12') }),
      entry('new-pinned-a', { pinned: true, date: new Date('2026-05-12') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), [
      'new-pinned-a',
      'new-pinned-b',
      'old-pinned',
      'new-unpinned',
    ]);
  });

  it('keeps featured projects public and newest first', () => {
    const sorted = featuredProjects([
      entry('draft-featured', { featured: true, draft: true, date: new Date('2026-05-13') }),
      entry('older-featured', { featured: true, draft: false, date: new Date('2026-05-10') }),
      entry('newer-featured', { featured: true, draft: false, date: new Date('2026-05-12') }),
      entry('plain', { featured: false, draft: false, date: new Date('2026-05-13') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), ['newer-featured', 'older-featured']);
  });
});

describe('technical notes content', () => {
  it('includes an engineering-focused URDF guide with modeling, validation, and expert workflow sections', async () => {
    const article = await readFile(
      new URL('../src/content/notes/robotics/ros/robot-urdf-modeling-guide.md', import.meta.url),
      'utf8',
    );

    assert.match(article, /title: 把机器人写成一棵可验证的树：URDF 从结构建模到工具链上手/);
    assert.match(article, /tags: \[机器人, ROS, URDF, 工具\]/);
    assert.doesNotMatch(article, /没有 ROS 2 环境/);
    assert.doesNotMatch(article, /本地不需要/);
    assert.match(article, /## 快速理解：URDF 解决的不是控制，而是结构共识/);
    assert.match(article, /## 心智模型：link 是节点，joint 是边/);
    assert.match(article, /## 上手路径：从最小模型到可视化验证/);
    assert.match(article, /## 工具链能力地图/);
    assert.match(article, /## URDF 一定要依赖 ROS 2 吗/);
    assert.match(article, /## 进阶路线：从能用到接近领域专家/);
    assert.match(article, /robot_state_publisher/);
    assert.match(article, /MoveIt Setup Assistant/);
    assert.match(article, /urdfpy/);
    assert.match(article, /Drake/);
    assert.match(article, /Isaac Sim/);
    assert.match(article, /USD/);
    assert.match(article, /MJCF/);
    assert.match(article, /https:\/\/docs\.ros\.org\/en\/rolling\/Tutorials\/Intermediate\/URDF\/URDF-Main\.html/);
    assert.match(article, /https:\/\/github\.com\/ros\/robot_state_publisher/);
    assert.match(article, /https:\/\/moveit\.picknik\.ai\/main\/doc\/examples\/setup_assistant\/setup_assistant_tutorial\.html/);
    assert.match(article, /https:\/\/github\.com\/ros\/urdfdom/);
    assert.match(article, /https:\/\/urdfpy\.readthedocs\.io\/en\/latest\/index\.html/);
    assert.match(article, /https:\/\/drake\.mit\.edu\/doxygen_cxx\/group__multibody__parsing\.html/);
    assert.match(article, /https:\/\/docs\.isaacsim\.omniverse\.nvidia\.com\/latest\/importer_exporter\/import_urdf\.html/);
  });
});
