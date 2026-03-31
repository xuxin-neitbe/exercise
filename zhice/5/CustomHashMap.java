import java.util.ArrayList;
import java.util.List;

/**
 * 自定义实现的简化版 HashMap
 * 使用链地址法处理哈希冲突，支持自动扩容
 * 
 * @param <K> 键类型
 * @param <V> 值类型
 */
public class CustomHashMap<K, V> {
    
    // 链表节点类
    private static class Node<K, V> {
        K key;
        V value;
        Node<K, V> next;
        
        Node(K key, V value) {
            this.key = key;
            this.value = value;
        }
    }
    
    // 默认初始容量（2 的幂）
    private static final int DEFAULT_CAPACITY = 16;
    
    // 负载因子
    private static final float LOAD_FACTOR = 0.75f;
    
    // 存储桶数组
    private Node<K, V>[] buckets;
    
    // 实际元素个数
    private int size;
    
    // 当前容量
    private int capacity;
    
    /**
     * 构造函数
     */
    @SuppressWarnings("unchecked")
    public CustomHashMap() {
        this.capacity = DEFAULT_CAPACITY;
        this.buckets = (Node<K, V>[]) new Node[capacity];
        this.size = 0;
    }
    
    /**
     * 添加或更新键值对
     * 时间复杂度：O(1) 平均，O(n) 最坏情况
     * 
     * @param key 键
     * @param value 值
     */
    public void put(K key, V value) {
        if (key == null) {
            throw new IllegalArgumentException("Key cannot be null");
        }
        
        int index = getIndex(key);
        Node<K, V> head = buckets[index];
        
        // 遍历链表，查找是否已存在该 key
        Node<K, V> current = head;
        while (current != null) {
            if (current.key.equals(key)) {
                // 更新已有值
                current.value = value;
                return;
            }
            current = current.next;
        }
        
        // 在链表头部插入新节点（头插法）
        Node<K, V> newNode = new Node<>(key, value);
        newNode.next = head;
        buckets[index] = newNode;
        size++;
        
        // 检查是否需要扩容
        if (shouldResize()) {
            resize();
        }
    }
    
    /**
     * 根据 key 获取 value
     * 时间复杂度：O(1) 平均，O(n) 最坏情况
     * 
     * @param key 键
     * @return 对应的值，不存在则返回 null
     */
    public V get(K key) {
        if (key == null) {
            throw new IllegalArgumentException("Key cannot be null");
        }
        
        int index = getIndex(key);
        Node<K, V> current = buckets[index];
        
        // 遍历链表查找
        while (current != null) {
            if (current.key.equals(key)) {
                return current.value;
            }
            current = current.next;
        }
        
        return null;
    }
    
    /**
     * 根据 key 删除键值对
     * 时间复杂度：O(1) 平均，O(n) 最坏情况
     * 
     * @param key 键
     * @return 被删除的值，不存在则返回 null
     */
    public V remove(K key) {
        if (key == null) {
            throw new IllegalArgumentException("Key cannot be null");
        }
        
        int index = getIndex(key);
        Node<K, V> head = buckets[index];
        
        if (head == null) {
            return null;
        }
        
        // 如果要删除的是头节点
        if (head.key.equals(key)) {
            V value = head.value;
            buckets[index] = head.next;
            size--;
            return value;
        }
        
        // 查找要删除的节点
        Node<K, V> current = head;
        while (current.next != null) {
            if (current.next.key.equals(key)) {
                V value = current.next.value;
                current.next = current.next.next;
                size--;
                return value;
            }
            current = current.next;
        }
        
        return null;
    }
    
    /**
     * 判断是否包含指定的 key
     * 
     * @param key 键
     * @return 如果存在返回 true
     */
    public boolean containsKey(K key) {
        return get(key) != null;
    }
    
    /**
     * 获取 HashMap 的大小
     * 
     * @return 元素个数
     */
    public int size() {
        return size;
    }
    
    /**
     * 判断是否为空
     * 
     * @return 如果为空返回 true
     */
    public boolean isEmpty() {
        return size == 0;
    }
    
    /**
     * 清空 HashMap
     */
    public void clear() {
        for (int i = 0; i < capacity; i++) {
            buckets[i] = null;
        }
        size = 0;
    }
    
    /**
     * 获取 key 的哈希值并映射到桶索引
     * 使用位运算优化取模操作
     * 
     * @param key 键
     * @return 桶索引
     */
    private int getIndex(K key) {
        int hash = key.hashCode();
        // 扰动函数：高位参与运算，减少哈希冲突
        hash = hash ^ (hash >>> 16);
        // 位运算代替取模：hash % capacity = hash & (capacity - 1)
        return hash & (capacity - 1);
    }
    
    /**
     * 检查是否需要扩容
     * 
     * @return 如果需要扩容返回 true
     */
    private boolean shouldResize() {
        return size >= capacity * LOAD_FACTOR;
    }
    
    /**
     * 扩容：容量翻倍，重新哈希所有元素
     * 时间复杂度：O(n)
     */
    @SuppressWarnings("unchecked")
    private void resize() {
        int oldCapacity = capacity;
        Node<K, V>[] oldBuckets = buckets;
        
        // 容量翻倍
        capacity = oldCapacity * 2;
        buckets = (Node<K, V>[]) new Node[capacity];
        size = 0; // 重置 size，重新添加会累加
        
        // 重新哈希所有元素
        for (int i = 0; i < oldCapacity; i++) {
            Node<K, V> current = oldBuckets[i];
            while (current != null) {
                // 保存下一个节点
                Node<K, V> next = current.next;
                
                // 重新插入到新数组
                int index = getIndex(current.key);
                current.next = buckets[index];
                buckets[index] = current;
                size++;
                
                current = next;
            }
        }
    }
    
    /**
     * 获取所有键的列表
     * 
     * @return 键列表
     */
    public List<K> keySet() {
        List<K> keys = new ArrayList<>();
        for (int i = 0; i < capacity; i++) {
            Node<K, V> current = buckets[i];
            while (current != null) {
                keys.add(current.key);
                current = current.next;
            }
        }
        return keys;
    }
    
    /**
     * 获取所有值的列表
     * 
     * @return 值列表
     */
    public List<V> values() {
        List<V> values = new ArrayList<>();
        for (int i = 0; i < capacity; i++) {
            Node<K, V> current = buckets[i];
            while (current != null) {
                values.add(current.value);
                current = current.next;
            }
        }
        return values;
    }
    
    /**
     * 打印 HashMap 内部结构（用于调试）
     */
    public void printStructure() {
        System.out.println("HashMap 结构 (容量：" + capacity + ", 大小：" + size + ")：");
        for (int i = 0; i < capacity; i++) {
            System.out.print("桶 [" + i + "]: ");
            Node<K, V> current = buckets[i];
            while (current != null) {
                System.out.print("(" + current.key + "=" + current.value + ") -> ");
                current = current.next;
            }
            System.out.println("null");
        }
    }
    
    /**
     * 测试类
     */
    public static void main(String[] args) {
        System.out.println("=== 测试 1：基本功能测试 ===\n");
        testBasicFunctionality();
        
        System.out.println("\n=== 测试 2：哈希冲突测试 ===\n");
        testHashCollisions();
        
        System.out.println("\n=== 测试 3：自动扩容测试 ===\n");
        testAutoResize();
        
        System.out.println("\n=== 测试 4：删除操作测试 ===\n");
        testRemove();
    }
    
    /**
     * 测试基本功能
     */
    private static void testBasicFunctionality() {
        CustomHashMap<String, Integer> map = new CustomHashMap<>();
        
        map.put("one", 1);
        map.put("two", 2);
        map.put("three", 3);
        
        System.out.println("get(\"one\"): " + map.get("one"));
        System.out.println("get(\"two\"): " + map.get("two"));
        System.out.println("get(\"three\"): " + map.get("three"));
        System.out.println("get(\"four\"): " + map.get("four"));
        
        System.out.println("size: " + map.size());
        System.out.println("containsKey(\"two\"): " + map.containsKey("two"));
        System.out.println("containsKey(\"five\"): " + map.containsKey("five"));
    }
    
    /**
     * 测试哈希冲突
     */
    private static void testHashCollisions() {
        CustomHashMap<Integer, String> map = new CustomHashMap<>();
        
        // 添加多个元素，可能会产生哈希冲突
        for (int i = 0; i < 10; i++) {
            map.put(i, "value" + i);
        }
        
        map.printStructure();
        
        System.out.println("\n验证所有值：");
        for (int i = 0; i < 10; i++) {
            System.out.println("get(" + i + "): " + map.get(i));
        }
    }
    
    /**
     * 测试自动扩容
     */
    private static void testAutoResize() {
        CustomHashMap<Integer, String> map = new CustomHashMap<>();
        
        System.out.println("初始容量：" + 16);
        System.out.println("扩容阈值：" + (int)(16 * 0.75) + " (16 * 0.75)");
        
        // 添加元素触发扩容
        for (int i = 0; i < 20; i++) {
            map.put(i, "value" + i);
            System.out.println("put(" + i + ") 后 size=" + map.size());
        }
        
        System.out.println("\n扩容后结构：");
        map.printStructure();
        
        // 验证所有值
        System.out.println("\n验证所有值：");
        for (int i = 0; i < 20; i++) {
            if (map.get(i) == null) {
                System.out.println("错误：get(" + i + ") 返回 null");
            }
        }
        System.out.println("所有值验证通过！");
    }
    
    /**
     * 测试删除操作
     */
    private static void testRemove() {
        CustomHashMap<String, Integer> map = new CustomHashMap<>();
        
        map.put("A", 1);
        map.put("B", 2);
        map.put("C", 3);
        map.put("D", 4);
        
        System.out.println("删除前：");
        map.printStructure();
        
        System.out.println("\n删除 B: " + map.remove("B"));
        System.out.println("删除 D: " + map.remove("D"));
        System.out.println("删除不存在的 E: " + map.remove("E"));
        
        System.out.println("\n删除后：");
        map.printStructure();
        
        System.out.println("\n验证：");
        System.out.println("get(\"A\"): " + map.get("A"));
        System.out.println("get(\"B\"): " + map.get("B"));
        System.out.println("get(\"C\"): " + map.get("C"));
        System.out.println("get(\"D\"): " + map.get("D"));
        
        System.out.println("\nsize: " + map.size());
    }
}