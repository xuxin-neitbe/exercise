import java.util.HashMap;
import java.util.Map;

public class LRUCache {
    // 双向链表节点类
    class DListNode {
        int key;
        int value;
        DListNode prev;
        DListNode next;
        
        public DListNode() {}
        
        public DListNode(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }
    
    private Map<Integer, DListNode> cache;
    private int size;
    private int capacity;
    
    // 虚拟头节点和尾节点，简化边界处理
    private DListNode head;
    private DListNode tail;
    
    public LRUCache(int capacity) {
        this.size = 0;
        this.capacity = capacity;
        
        // 初始化双向链表
        this.head = new DListNode();
        this.tail = new DListNode();
        head.next = tail;
        tail.prev = head;
        
        // 初始化哈希表
        this.cache = new HashMap<>();
    }
    
    public int get(int key) {
        DListNode node = cache.get(key);
        
        // 如果键不存在，返回 -1
        if (node == null) {
            return -1;
        }
        
        // 如果键存在，移动节点到头部（标记为最近使用）
        moveToHead(node);
        return node.value;
    }
    
    public void put(int key, int value) {
        DListNode node = cache.get(key);
        
        if (node == null) {
            // 键不存在，创建新节点
            DListNode newNode = new DListNode(key, value);
            
            // 添加到哈希表
            cache.put(key, newNode);
            
            // 添加到双向链表头部
            addToHead(newNode);
            ++size;
            
            // 如果超出容量，删除尾部节点
            if (size > capacity) {
                DListNode tail = removeTail();
                cache.remove(tail.key);
                --size;
            }
        } else {
            // 键存在，更新值并移动到头部
            node.value = value;
            moveToHead(node);
        }
    }
    
    // 在头部添加节点
    private void addToHead(DListNode node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }
    
    // 删除节点
    private void removeNode(DListNode node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    // 移动节点到头部
    private void moveToHead(DListNode node) {
        removeNode(node);
        addToHead(node);
    }
    
    // 删除尾部节点
    private DListNode removeTail() {
        DListNode res = tail.prev;
        removeNode(res);
        return res;
    }
    
    // 用于测试的辅助方法
    public void printCache() {
        System.out.print("Cache: ");
        DListNode curr = head.next;
        while (curr != tail) {
            System.out.print("(" + curr.key + "," + curr.value + ") ");
            curr = curr.next;
        }
        System.out.println();
    }
    
    public static void main(String[] args) {
        LRUCache lruCache = new LRUCache(2);
        
        System.out.println("执行 put(1, 1)");
        lruCache.put(1, 1); // 缓存是 {1=1}
        lruCache.printCache();
        
        System.out.println("执行 put(2, 2)");
        lruCache.put(2, 2); // 缓存是 {1=1, 2=2}
        lruCache.printCache();
        
        System.out.println("执行 get(1): " + lruCache.get(1)); // 返回 1
        lruCache.printCache();
        
        System.out.println("执行 put(3, 3)"); // 该操作会使得关键字 2 作废
        lruCache.put(3, 3); // 缓存是 {1=1, 3=3}
        lruCache.printCache();
        
        System.out.println("执行 get(2): " + lruCache.get(2)); // 返回 -1 (未找到)
        lruCache.printCache();
        
        System.out.println("执行 put(4, 4)"); // 该操作会使得关键字 1 作废
        lruCache.put(4, 4); // 缓存是 {4=4, 3=3}
        lruCache.printCache();
        
        System.out.println("执行 get(1): " + lruCache.get(1)); // 返回 -1 (未找到)
        lruCache.printCache();
        
        System.out.println("执行 get(3): " + lruCache.get(3)); // 返回 3
        lruCache.printCache();
        
        System.out.println("执行 get(4): " + lruCache.get(4)); // 返回 4
        lruCache.printCache();
    }
}