# 好友请求功能修复 - 任务列表

**创建日期**: 2026-02-21  
**预估工时**: 1-2 小时

---

## 任务概览

| 任务ID | 任务名称 | 优先级 | 状态 |
|--------|----------|--------|------|
| T1 | 修复 handleAddFriend 函数逻辑 | 高 | 待开始 |
| T2 | 增强用户搜索 API 返回数据 | 中 | 待开始 |
| T3 | 更新搜索结果按钮状态显示 | 高 | 待开始 |
| T4 | 测试完整好友流程 | 高 | 待开始 |

---

## 详细任务

### T1: 修复 handleAddFriend 函数逻辑

**文件**: `src/components/chat/Sidebar.tsx`

**修改内容**:
- 移除发送请求后直接添加好友的逻辑
- 改为更新搜索结果中的状态标记

**代码修改**:

```typescript
// 修改前 (第102-124行)
const handleAddFriend = async (friendId: string) => {
    try {
        await fetch('/api/friends', { ... })
        setSearchResults(prev => prev.map(u =>
            u.id === friendId ? { ...u, isFriend: true } : u
        ))
        // ❌ 错误：pending 状态不应该添加到好友列表
        const resultUser = searchResults.find(u => u.id === friendId)
        if (resultUser) {
            addFriend({ ... })
        }
    } catch (error) { ... }
}

// 修改后
const handleAddFriend = async (friendId: string) => {
    try {
        await fetch('/api/friends', { ... })
        // ✅ 正确：只更新状态为"已发送请求"
        setSearchResults(prev => prev.map(u =>
            u.id === friendId ? { ...u, requestSent: true } : u
        ))
    } catch (error) { ... }
}
```

**验收标准**:
- [ ] 发送请求后不调用 `addFriend`
- [ ] 搜索结果中该用户显示"已发送"状态

---

### T2: 增强用户搜索 API 返回数据

**文件**: `src/repositories/index.ts`

**修改内容**:
- 在 `search` 方法中增加已发送请求的判断
- 返回 `hasPendingRequest` 字段

**代码修改**:

```typescript
// 在 UserRepository.search 方法中增加查询
async search(query: string, currentUserId: string, limit: number = 10) {
    // ... 现有代码 ...

    // 查询已发送的请求
    const sentRequests = await prisma.friendship.findMany({
        where: {
            userId: currentUserId,
            status: 'pending'
        },
        select: { friendId: true }
    })
    const sentRequestIds = new Set(sentRequests.map(r => r.friendId))

    return users.map(user => ({
        ...user,
        isFriend: friendIds.has(user.id),
        hasPendingRequest: sentRequestIds.has(user.id)  // 新增
    }))
}
```

**验收标准**:
- [ ] API 返回 `hasPendingRequest` 字段
- [ ] 已发送请求的用户显示正确状态

---

### T3: 更新搜索结果按钮状态显示

**文件**: `src/components/chat/Sidebar.tsx`

**修改内容**:
- 更新搜索结果类型定义
- 更新按钮显示逻辑

**代码修改**:

```typescript
// 1. 更新类型定义 (第40行)
const [searchResults, setSearchResults] = useState<(Friend & { 
    email?: string; 
    isFriend?: boolean;
    hasPendingRequest?: boolean;  // 新增
    requestSent?: boolean;        // 本地状态
})[]>([])

// 2. 更新按钮显示逻辑 (第320-327行)
<Button
    size="sm"
    variant={
        result.isFriend ? 'secondary' : 
        (result.hasPendingRequest || result.requestSent) ? 'secondary' : 'primary'
    }
    disabled={result.isFriend || result.hasPendingRequest || result.requestSent}
    onClick={() => handleAddFriend(result.id)}
>
    {result.isFriend ? '已添加' : 
     (result.hasPendingRequest || result.requestSent) ? '已发送' : '添加'}
</Button>
```

**验收标准**:
- [ ] 已是好友显示"已添加"
- [ ] 已发送请求显示"已发送"
- [ ] 无关系显示"添加"

---

### T4: 测试完整好友流程

**测试步骤**:

1. **发送请求测试**
   - [ ] 用户A搜索用户B
   - [ ] 点击"添加"按钮
   - [ ] 按钮变为"已发送"
   - [ ] 用户A的好友列表不显示用户B

2. **接收请求测试**
   - [ ] 用户B登录
   - [ ] 切换到好友页面
   - [ ] 看到用户A的好友请求
   - [ ] 请求显示用户A的信息

3. **接受请求测试**
   - [ ] 用户B点击"接受"
   - [ ] 请求从待处理列表消失
   - [ ] 用户A出现在用户B的好友列表
   - [ ] 用户B出现在用户A的好友列表

4. **拒绝请求测试**
   - [ ] 用户C发送请求给用户D
   - [ ] 用户D点击"拒绝"
   - [ ] 请求消失
   - [ ] 双方好友列表无变化

---

## 依赖关系

```
T1 ──────────────────┐
                      ├──> T4
T2 ──> T3 ────────────┘
```

- T1 可独立进行
- T2 需要先完成，T3 才能使用新字段
- T4 需要所有修改完成后进行

---

*文档结束*
