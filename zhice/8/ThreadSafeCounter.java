import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.concurrent.CountDownLatch;

/**
 * 方案一：使用 synchronized 实现的线程安全计数器
 */
class SynchronizedCounter {
    private long count = 0;

    public synchronized long increment() {
        count++;
        return count;
    }

    public synchronized long decrement() {
        count--;
        return count;
    }

    public synchronized long get() {
        return count;
    }

    public synchronized void reset() {
        count = 0;
    }
}

/**
 * 方案二：使用 ReentrantLock 实现的线程安全计数器
 */
class LockCounter {
    private long count = 0;
    private final ReentrantLock lock = new ReentrantLock();

    public long increment() {
        lock.lock();
        try {
            count++;
            return count;
        } finally {
            lock.unlock();
        }
    }

    public long decrement() {
        lock.lock();
        try {
            count--;
            return count;
        } finally {
            lock.unlock();
        }
    }

    public long get() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }

    public void reset() {
        lock.lock();
        try {
            count = 0;
        } finally {
            lock.unlock();
        }
    }
}

/**
 * 方案三：使用 AtomicLong 实现的高性能线程安全计数器 ⭐ 推荐
 */
class AtomicCounter {
    private final AtomicLong count = new AtomicLong(0);

    public long increment() {
        return count.incrementAndGet();
    }

    public long decrement() {
        return count.decrementAndGet();
    }

    public long get() {
        return count.get();
    }

    public void reset() {
        count.set(0);
    }

    // 高级操作：CAS 操作
    public boolean compareAndSet(long expectedValue, long newValue) {
        return count.compareAndSet(expectedValue, newValue);
    }

    // 高级操作：原子地增加指定值
    public long addAndGet(long delta) {
        return count.addAndGet(delta);
    }

    // 高级操作：原子地获取并增加指定值
    public long getAndAdd(long delta) {
        return count.getAndAdd(delta);
    }
}

/**
 * 方案四：使用 LongAdder 实现的超高并发计数器（Java 8+）⭐⭐ 高并发场景最优
 * 适用于读多写少、高并发场景
 * 
 * 注意：LongAdder 使用分散计数策略，sum() 方法只能提供最终一致性，
 * 因此 increment()/decrement() 的返回值在高并发场景下可能不精确。
 * 如果需要精确的返回值，建议使用 AtomicCounter。
 */
class LongAdderCounter {
    private final java.util.concurrent.atomic.LongAdder count = new java.util.concurrent.atomic.LongAdder();

    public long increment() {
        count.increment();
        return count.sum();
    }

    public long decrement() {
        count.decrement();
        return count.sum();
    }

    public long get() {
        return count.sum();
    }

    public void reset() {
        count.reset();
    }

    public void add(long n) {
        count.add(n);
    }
}

/**
 * 线程安全计数器测试类
 */
public class ThreadSafeCounter {

    // 测试线程数
    private static final int THREAD_COUNT = 10;
    // 每个线程操作次数
    private static final int OPERATIONS_PER_THREAD = 10000;

    public static void main(String[] args) throws InterruptedException {
        System.out.println("=== 线程安全计数器测试 ===\n");

        // 1. 基本功能测试
        System.out.println("1. 基本功能测试：");
        testBasicFunctionality();

        // 2. 线程安全性测试
        System.out.println("\n2. 线程安全性测试：");
        testThreadSafety();

        // 3. 性能对比测试
        System.out.println("\n3. 性能对比测试：");
        testPerformance();

        // 4. CAS 操作演示
        System.out.println("\n4. CAS 操作演示：");
        testCASOperation();

        System.out.println("\n✅ 所有测试完成！");
    }

    /**
     * 测试基本功能
     */
    private static void testBasicFunctionality() {
        AtomicCounter counter = new AtomicCounter();

        System.out.println("初始值：" + counter.get());

        System.out.println("increment(): " + counter.increment());
        System.out.println("increment(): " + counter.increment());
        System.out.println("increment(): " + counter.increment());

        System.out.println("decrement(): " + counter.decrement());
        System.out.println("decrement(): " + counter.decrement());

        System.out.println("get(): " + counter.get());

        counter.reset();
        System.out.println("reset() 后：" + counter.get());
    }

    /**
     * 测试线程安全性
     */
    private static void testThreadSafety() throws InterruptedException {
        System.out.println("使用 " + THREAD_COUNT + " 个线程，每个线程递增 " + OPERATIONS_PER_THREAD + " 次");
        System.out.println("预期结果：" + (THREAD_COUNT * OPERATIONS_PER_THREAD));
        System.out.println();

        // 测试 AtomicCounter
        AtomicCounter atomicCounter = new AtomicCounter();
        testCounterThreadSafety("AtomicCounter", atomicCounter);

        // 测试 SynchronizedCounter
        SynchronizedCounter syncCounter = new SynchronizedCounter();
        testCounterThreadSafety("SynchronizedCounter", syncCounter);

        // 测试 LockCounter
        LockCounter lockCounter = new LockCounter();
        testCounterThreadSafety("LockCounter", lockCounter);

        // 测试 LongAdderCounter
        LongAdderCounter longAdderCounter = new LongAdderCounter();
        testCounterThreadSafety("LongAdderCounter", longAdderCounter);
    }

    private static void testCounterThreadSafety(String name, Object counterObj) throws InterruptedException {
        Thread[] threads = new Thread[THREAD_COUNT];
        CountDownLatch startLatch = new CountDownLatch(1);

        // 创建并启动线程
        for (int i = 0; i < THREAD_COUNT; i++) {
            threads[i] = new Thread(() -> {
                try {
                    startLatch.await(); // 等待所有线程准备就绪

                    if (counterObj instanceof AtomicCounter) {
                        AtomicCounter counter = (AtomicCounter) counterObj;
                        for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                            counter.increment();
                        }
                    } else if (counterObj instanceof SynchronizedCounter) {
                        SynchronizedCounter counter = (SynchronizedCounter) counterObj;
                        for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                            counter.increment();
                        }
                    } else if (counterObj instanceof LockCounter) {
                        LockCounter counter = (LockCounter) counterObj;
                        for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                            counter.increment();
                        }
                    } else if (counterObj instanceof LongAdderCounter) {
                        LongAdderCounter counter = (LongAdderCounter) counterObj;
                        for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                            counter.increment();
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            threads[i].start();
        }

        // 同时启动所有线程
        startLatch.countDown();

        // 等待所有线程完成
        for (Thread thread : threads) {
            thread.join();
        }

        // 获取结果
        long result = 0;
        if (counterObj instanceof AtomicCounter) {
            result = ((AtomicCounter) counterObj).get();
        } else if (counterObj instanceof SynchronizedCounter) {
            result = ((SynchronizedCounter) counterObj).get();
        } else if (counterObj instanceof LockCounter) {
            result = ((LockCounter) counterObj).get();
        } else if (counterObj instanceof LongAdderCounter) {
            result = ((LongAdderCounter) counterObj).get();
        }

        boolean passed = (result == THREAD_COUNT * OPERATIONS_PER_THREAD);
        System.out.printf("%-20s 结果：%10d %s\n",
                name,
                result,
                passed ? "✓ 线程安全" : "✗ 线程不安全");
    }

    /**
     * 性能对比测试
     */
    private static void testPerformance() {
        int warmupIterations = 3;
        int testIterations = 5;

        System.out.println("预热测试（" + warmupIterations + " 次）...");
        for (int i = 0; i < warmupIterations; i++) {
            runPerformanceTest(new AtomicCounter());
            runPerformanceTest(new SynchronizedCounter());
            runPerformanceTest(new LockCounter());
            runPerformanceTest(new LongAdderCounter());
        }

        System.out.println("\n正式测试（" + testIterations + " 次平均）：");

        long[] atomicTimes = new long[testIterations];
        long[] syncTimes = new long[testIterations];
        long[] lockTimes = new long[testIterations];
        long[] longAdderTimes = new long[testIterations];

        for (int i = 0; i < testIterations; i++) {
            atomicTimes[i] = runPerformanceTest(new AtomicCounter());
            syncTimes[i] = runPerformanceTest(new SynchronizedCounter());
            lockTimes[i] = runPerformanceTest(new LockCounter());
            longAdderTimes[i] = runPerformanceTest(new LongAdderCounter());
        }

        System.out.println("\n性能对比（毫秒，越小越好）：");
        System.out.printf("%-20s: %10.2f ms\n", "AtomicCounter", average(atomicTimes));
        System.out.printf("%-20s: %10.2f ms\n", "SynchronizedCounter", average(syncTimes));
        System.out.printf("%-20s: %10.2f ms\n", "LockCounter", average(lockTimes));
        System.out.printf("%-20s: %10.2f ms\n", "LongAdderCounter", average(longAdderTimes));
    }

    private static long runPerformanceTest(Object counter) {
        Thread[] threads = new Thread[THREAD_COUNT];
        CountDownLatch startLatch = new CountDownLatch(1);

        long startTime = 0;
        long endTime = 0;

        for (int i = 0; i < THREAD_COUNT; i++) {
            threads[i] = new Thread(() -> {
                try {
                    startLatch.await();

                    for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                        if (counter instanceof AtomicCounter) {
                            ((AtomicCounter) counter).increment();
                        } else if (counter instanceof SynchronizedCounter) {
                            ((SynchronizedCounter) counter).increment();
                        } else if (counter instanceof LockCounter) {
                            ((LockCounter) counter).increment();
                        } else if (counter instanceof LongAdderCounter) {
                            ((LongAdderCounter) counter).increment();
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            threads[i].start();
        }

        startTime = System.nanoTime();
        startLatch.countDown();

        try {
            for (Thread thread : threads) {
                thread.join();
            }
            endTime = System.nanoTime();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return endTime - startTime;
    }

    private static double average(long[] times) {
        long sum = 0;
        for (long time : times) {
            sum += time;
        }
        return sum / (double) times.length / 1_000_000.0; // 转换为毫秒
    }

    /**
     * 测试 CAS 操作
     */
    private static void testCASOperation() {
        AtomicCounter counter = new AtomicCounter();

        System.out.println("初始值：" + counter.get());

        // CAS 操作：如果当前值是 0，则设置为 10
        boolean success = counter.compareAndSet(0, 10);
        System.out.println("CAS(0, 10): " + success + ", 当前值：" + counter.get());

        // CAS 操作：如果当前值是 0，则设置为 20（应该失败）
        success = counter.compareAndSet(0, 20);
        System.out.println("CAS(0, 20): " + success + ", 当前值：" + counter.get());

        // CAS 操作：如果当前值是 10，则设置为 20
        success = counter.compareAndSet(10, 20);
        System.out.println("CAS(10, 20): " + success + ", 当前值：" + counter.get());

        // addAndGet 操作
        System.out.println("addAndGet(5): " + counter.addAndGet(5));

        // getAndAdd 操作（返回旧值）
        System.out.println("getAndAdd(10): " + counter.getAndAdd(10) + ", 当前值：" + counter.get());
    }
}