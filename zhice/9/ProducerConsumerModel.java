import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 基于阻塞队列的生产者 - 消费者模型
 * 支持优雅停止、线程安全
 */
public class ProducerConsumerModel {

    // 阻塞队列
    private final BlockingQueue<Integer> queue;

    // 队列容量
    private final int capacity;

    // 生产者数量
    private final int producerCount;

    // 消费者数量
    private final int consumerCount;

    // 每个生产者生产的消息数量
    private final int messagesPerProducer;

    // 原子计数器
    private final AtomicInteger producedCount = new AtomicInteger(0);
    private final AtomicInteger consumedCount = new AtomicInteger(0);

    // 运行标志
    private final AtomicBoolean running = new AtomicBoolean(true);

    // 线程池
    private ExecutorService executor;

    // 统计信息
    private final AtomicLong totalProduceTime = new AtomicLong(0);
    private final AtomicLong totalConsumeTime = new AtomicLong(0);

    /**
     * 构造函数
     * 
     * @param capacity            队列容量
     * @param producerCount       生产者数量
     * @param consumerCount       消费者数量
     * @param messagesPerProducer 每个生产者生产的消息数量
     */
    public ProducerConsumerModel(int capacity, int producerCount,
            int consumerCount, int messagesPerProducer) {
        this.capacity = capacity;
        this.producerCount = producerCount;
        this.consumerCount = consumerCount;
        this.messagesPerProducer = messagesPerProducer;

        // 使用 ArrayBlockingQueue（有界阻塞队列）
        this.queue = new ArrayBlockingQueue<>(capacity);
    }

    /**
     * 启动生产者 - 消费者模型
     */
    public void start() {
        executor = Executors.newFixedThreadPool(producerCount + consumerCount);

        System.out.println("=== 启动生产者 - 消费者模型 ===");
        System.out.println("队列容量：" + capacity);
        System.out.println("生产者数量：" + producerCount);
        System.out.println("消费者数量：" + consumerCount);
        System.out.println("每个生产者生产消息数：" + messagesPerProducer);
        System.out.println("预计总消息数：" + (producerCount * messagesPerProducer));
        System.out.println();

        // 启动生产者线程
        for (int i = 0; i < producerCount; i++) {
            final int producerId = i;
            executor.submit(new Producer(producerId));
        }

        // 启动消费者线程
        for (int i = 0; i < consumerCount; i++) {
            final int consumerId = i;
            executor.submit(new Consumer(consumerId));
        }
    }

    /**
     * 等待所有任务完成
     */
    public void awaitCompletion() {
        // 等待所有生产者完成
        while (producedCount.get() < producerCount * messagesPerProducer) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        // 等待所有消息被消费
        while (consumedCount.get() < producerCount * messagesPerProducer) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    /**
     * 优雅停止
     */
    public void shutdown() {
        running.set(false);
        if (executor != null) {
            executor.shutdown();
            try {
                // 等待任务完成
                if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                    // 强制终止
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * 生产者线程
     */
    class Producer implements Runnable {
        private final int producerId;

        public Producer(int producerId) {
            this.producerId = producerId;
        }

        @Override
        public void run() {
            try {
                for (int i = 0; i < messagesPerProducer && running.get(); i++) {
                    int message = producerId * messagesPerProducer + i;

                    long startTime = System.nanoTime();

                    // 生产数据（阻塞，如果队列满）
                    queue.put(message);

                    long endTime = System.nanoTime();
                    totalProduceTime.addAndGet(endTime - startTime);

                    producedCount.incrementAndGet();

                    System.out.printf("生产者 %d 生产：%d (队列大小：%d)%n",
                            producerId, message, queue.size());

                    // 模拟生产时间
                    Thread.sleep(10);
                }

                System.out.println("生产者 " + producerId + " 完成任务");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.out.println("生产者 " + producerId + " 被中断");
            }
        }
    }

    /**
     * 消费者线程
     */
    class Consumer implements Runnable {
        private final int consumerId;
        private int localConsumedCount = 0;

        public Consumer(int consumerId) {
            this.consumerId = consumerId;
        }

        @Override
        public void run() {
            try {
                while (running.get() || !queue.isEmpty()) {
                    // 消费数据（阻塞，如果队列空）
                    // 使用 poll 带超时，便于优雅停止
                    Integer message = queue.poll(100L, TimeUnit.MILLISECONDS);

                    if (message != null) {
                        long startTime = System.nanoTime();

                        // 处理消息
                        consume(message);

                        long endTime = System.nanoTime();
                        totalConsumeTime.addAndGet(endTime - startTime);

                        consumedCount.incrementAndGet();
                        localConsumedCount++;

                        System.out.printf("消费者 %d 消费：%d (队列大小：%d)%n",
                                consumerId, message, queue.size());
                    }
                }

                System.out.println("消费者 " + consumerId + " 完成任务，共消费 " +
                        localConsumedCount + " 条消息");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.out.println("消费者 " + consumerId + " 被中断");
            }
        }

        private void consume(int message) {
            // 模拟消费处理
            // 实际场景可能是：处理数据、写入数据库、发送通知等
            try {
                Thread.sleep(5); // 模拟处理时间
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * 获取统计信息
     */
    public void printStatistics() {
        System.out.println("\n=== 统计信息 ===");
        System.out.println("总生产消息数：" + producedCount.get());
        System.out.println("总消费消息数：" + consumedCount.get());
        System.out.println("平均生产时间：" +
                (producedCount.get() > 0 ? totalProduceTime.get() / producedCount.get() / 1_000_000.0 : 0)
                + " ms");
        System.out.println("平均消费时间：" +
                (consumedCount.get() > 0 ? totalConsumeTime.get() / consumedCount.get() / 1_000_000.0 : 0)
                + " ms");
        System.out.println("最终队列大小：" + queue.size());

        // 验证线程安全
        boolean isThreadSafe = (producedCount.get() == consumedCount.get());
        System.out.println("线程安全验证：" + (isThreadSafe ? "✓ 通过" : "✗ 失败"));
    }

    /**
     * 测试类
     */
    public static void main(String[] args) {
        System.out.println("=== 测试 1：基本功能测试 ===\n");
        testBasicFunctionality();

        System.out.println("\n=== 测试 2：高并发测试 ===\n");
        testHighConcurrency();

        System.out.println("\n=== 测试 3：队列满/空测试 ===\n");
        testQueueFullEmpty();
    }

    /**
     * 测试基本功能
     */
    private static void testBasicFunctionality() {
        ProducerConsumerModel model = new ProducerConsumerModel(
                10, // 队列容量
                3, // 生产者数量
                2, // 消费者数量
                20 // 每个生产者生产 20 条消息
        );

        model.start();
        model.awaitCompletion();
        model.shutdown();
        model.printStatistics();
    }

    /**
     * 测试高并发场景
     */
    private static void testHighConcurrency() {
        ProducerConsumerModel model = new ProducerConsumerModel(
                100, // 队列容量
                10, // 生产者数量
                5, // 消费者数量
                100 // 每个生产者生产 100 条消息
        );

        model.start();
        model.awaitCompletion();
        model.shutdown();
        model.printStatistics();
    }

    /**
     * 测试队列满/空的情况
     */
    private static void testQueueFullEmpty() {
        System.out.println("测试场景：小队列容量，快速生产，慢速消费");
        System.out.println("预期：队列会经常满，生产者会阻塞等待\n");

        ProducerConsumerModel model = new ProducerConsumerModel(
                5, // 很小的队列容量
                2, // 生产者数量
                1, // 消费者数量（只有一个消费者，消费速度慢）
                30 // 每个生产者生产 30 条消息
        );

        model.start();
        model.awaitCompletion();
        model.shutdown();
        model.printStatistics();
    }
}