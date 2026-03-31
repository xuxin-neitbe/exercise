import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 基于 ReentrantLock 和 Condition 实现的有界阻塞队列
 * 
 * @param <E> 队列元素类型
 */
public class BlockingQueue<E> {

    // 底层数组存储队列元素
    private final Object[] items;

    // 队列头、尾指针
    private int head; // 取元素的位置
    private int tail; // 放元素的位置

    // 队列中实际元素个数
    private int count;

    // 可重入锁
    private final ReentrantLock lock;

    // 非空条件（消费者等待）
    private final Condition notEmpty;

    // 非满条件（生产者等待）
    private final Condition notFull;

    /**
     * 构造函数
     * 
     * @param capacity 队列容量
     */
    public BlockingQueue(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be positive, got: " + capacity);
        }

        this.items = new Object[capacity];
        this.head = 0;
        this.tail = 0;
        this.count = 0;

        this.lock = new ReentrantLock();
        this.notEmpty = lock.newCondition();
        this.notFull = lock.newCondition();
    }

    /**
     * 向队列中添加元素（阻塞）
     * 如果队列已满，当前线程阻塞等待
     * 
     * @param e 要添加的元素
     * @throws InterruptedException 如果线程在等待中被中断
     */
    public void put(E e) throws InterruptedException {
        if (e == null) {
            throw new NullPointerException("Element cannot be null");
        }
        lock.lock();
        try {
            while (count == items.length) {
                notFull.await();
            }

            // 添加元素到队尾
            items[tail] = e;
            tail = (tail + 1) % items.length; // 循环数组
            count++;

            // 唤醒等待的消费者线程
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    /**
     * 从队列中取出元素（阻塞）
     * 如果队列为空，当前线程阻塞等待
     * 
     * @return 队列头部的元素
     * @throws InterruptedException 如果线程在等待中被中断
     */
    @SuppressWarnings("unchecked")
    public E take() throws InterruptedException {
        lock.lock();
        try {
            // 如果队列为空，等待 notEmpty 条件
            while (count == 0) {
                notEmpty.await();
            }

            // 从队头取出元素
            E element = (E) items[head];
            items[head] = null; // 帮助 GC
            head = (head + 1) % items.length; // 循环数组
            count--;

            // 唤醒等待的生产者线程
            notFull.signal();

            return element;
        } finally {
            lock.unlock();
        }
    }

    /**
     * 向队列中添加元素（非阻塞）
     * 
     * @param e 要添加的元素
     * @return 如果添加成功返回 true，队列已满返回 false
     */
    public boolean offer(E e) {
        if (e == null) {
            throw new NullPointerException("Element cannot be null");
        }
        lock.lock();
        try {
            if (count == items.length) {
                return false;
            }

            items[tail] = e;
            tail = (tail + 1) % items.length;
            count++;

            notEmpty.signal();
            return true;
        } finally {
            lock.unlock();
        }
    }

    /**
     * 从队列中取出元素（非阻塞）
     * 
     * @return 队列头部的元素，如果队列为空返回 null
     */
    @SuppressWarnings("unchecked")
    public E poll() {
        lock.lock();
        try {
            if (count == 0) {
                return null;
            }

            E element = (E) items[head];
            items[head] = null;
            head = (head + 1) % items.length;
            count--;

            notFull.signal();

            return element;
        } finally {
            lock.unlock();
        }
    }

    /**
     * 获取队列中的元素个数
     * 
     * @return 元素个数
     */
    public int size() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }

    /**
     * 判断队列是否为空
     * 
     * @return 如果为空返回 true
     */
    public boolean isEmpty() {
        lock.lock();
        try {
            return count == 0;
        } finally {
            lock.unlock();
        }
    }

    /**
     * 判断队列是否已满
     * 
     * @return 如果已满返回 true
     */
    public boolean isFull() {
        lock.lock();
        try {
            return count == items.length;
        } finally {
            lock.unlock();
        }
    }

    /**
     * 获取队列容量
     * 
     * @return 队列容量
     */
    public int capacity() {
        return items.length;
    }

    /**
     * 清空队列
     */
    public void clear() {
        lock.lock();
        try {
            for (int i = 0; i < items.length; i++) {
                items[i] = null;
            }
            head = 0;
            tail = 0;
            count = 0;

            // 唤醒所有等待的线程
            notFull.signalAll();
            notEmpty.signalAll();
        } finally {
            lock.unlock();
        }
    }

    /**
     * 测试类
     */
    public static void main(String[] args) throws InterruptedException {
        System.out.println("=== 测试 1：基本功能测试 ===");
        testBasicFunctionality();

        System.out.println("\n=== 测试 2：多线程生产者 - 消费者测试 ===");
        testMultiProducerConsumer();

        System.out.println("\n=== 测试 3：阻塞行为测试 ===");
        testBlockingBehavior();
    }

    /**
     * 测试基本功能
     */
    private static void testBasicFunctionality() throws InterruptedException {
        BlockingQueue<Integer> queue = new BlockingQueue<>(3);

        System.out.println("队列容量：" + queue.capacity());
        System.out.println("初始大小：" + queue.size());
        System.out.println("是否为空：" + queue.isEmpty());
        System.out.println("是否已满：" + queue.isFull());

        // 添加元素
        queue.put(1);
        queue.put(2);
        queue.put(3);

        System.out.println("\n添加 3 个元素后：");
        System.out.println("大小：" + queue.size());
        System.out.println("是否已满：" + queue.isFull());

        // 取出元素
        System.out.println("\n取出元素：");
        System.out.println("take(): " + queue.take());
        System.out.println("take(): " + queue.take());
        System.out.println("take(): " + queue.take());

        System.out.println("\n取出所有元素后：");
        System.out.println("大小：" + queue.size());
        System.out.println("是否为空：" + queue.isEmpty());
    }

    /**
     * 测试多线程生产者 - 消费者
     */
    private static void testMultiProducerConsumer() throws InterruptedException {
        BlockingQueue<Integer> queue = new BlockingQueue<>(5);

        // 创建 3 个生产者线程
        Thread[] producers = new Thread[3];
        for (int i = 0; i < producers.length; i++) {
            final int producerId = i;
            producers[i] = new Thread(() -> {
                try {
                    for (int j = 0; j < 5; j++) {
                        int value = producerId * 100 + j;
                        queue.put(value);
                        System.out.println("生产者 " + producerId + " 生产：" + value);
                        Thread.sleep(50); // 模拟生产时间
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // 创建 2 个消费者线程
        Thread[] consumers = new Thread[2];
        for (int i = 0; i < consumers.length; i++) {
            final int consumerId = i;
            consumers[i] = new Thread(() -> {
                try {
                    for (int j = 0; j < 7; j++) {
                        Integer value = queue.take();
                        System.out.println("消费者 " + consumerId + " 消费：" + value);
                        Thread.sleep(100); // 模拟消费时间
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // 启动所有线程
        for (Thread producer : producers) {
            producer.start();
        }
        for (Thread consumer : consumers) {
            consumer.start();
        }

        // 等待所有线程完成
        for (Thread producer : producers) {
            producer.join();
        }
        for (Thread consumer : consumers) {
            consumer.join();
        }

        System.out.println("\n最终队列大小：" + queue.size());
    }

    /**
     * 测试阻塞行为
     */
    private static void testBlockingBehavior() throws InterruptedException {
        BlockingQueue<Integer> queue = new BlockingQueue<>(2);

        // 测试 put 阻塞
        System.out.println("测试 put 阻塞：");
        queue.put(1);
        queue.put(2);
        System.out.println("队列已满，准备 put 第三个元素（将阻塞）...");

        Thread producer = new Thread(() -> {
            try {
                System.out.println("生产者尝试 put(3)...");
                queue.put(3);
                System.out.println("生产者 put(3) 成功！");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        Thread.sleep(500); // 等待生产者尝试 put

        System.out.println("主线程消费一个元素，唤醒生产者...");
        queue.take();
        producer.join(); // 等待生产者完成

        // 测试 take 阻塞
        System.out.println("\n测试 take 阻塞：");
        queue.put(10);
        queue.put(20);
        queue.take();
        queue.take();
        System.out.println("队列已空，准备 take（将阻塞）...");

        Thread consumer = new Thread(() -> {
            try {
                System.out.println("消费者尝试 take()...");
                Integer value = queue.take();
                System.out.println("消费者 take() 成功：" + value);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        consumer.start();
        Thread.sleep(500); // 等待消费者尝试 take

        System.out.println("主线程生产一个元素，唤醒消费者...");
        queue.put(30);
        consumer.join(); // 等待消费者完成

        System.out.println("\n阻塞行为测试完成！");
    }
}