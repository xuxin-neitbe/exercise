import java.util.Arrays;

/**
 * 排序策略接口
 */
interface SortStrategy {
    /**
     * 排序方法
     * @param arr 待排序数组
     */
    void sort(int[] arr);
    
    /**
     * 获取排序算法名称
     * @return 算法名称
     */
    String getName();
}

/**
 * 快速排序策略实现
 */
class QuickSortStrategy implements SortStrategy {
    @Override
    public void sort(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        quickSort(arr, 0, arr.length - 1);
    }
    
    private void quickSort(int[] arr, int left, int right) {
        if (left >= right) {
            return;
        }
        
        // 三数取中选择基准值
        int mid = left + (right - left) / 2;
        int pivotIndex = medianOfThree(arr, left, mid, right);
        swap(arr, left, pivotIndex);
        
        int pivot = partition(arr, left, right);
        quickSort(arr, left, pivot - 1);
        quickSort(arr, pivot + 1, right);
    }
    
    private int medianOfThree(int[] arr, int i, int j, int k) {
        if (arr[i] < arr[j]) {
            if (arr[j] < arr[k]) return j;
            else if (arr[i] < arr[k]) return k;
            else return i;
        } else {
            if (arr[i] < arr[k]) return i;
            else if (arr[j] < arr[k]) return k;
            else return j;
        }
    }
    
    private int partition(int[] arr, int left, int right) {
        int pivot = arr[left];
        
        while (left < right) {
            while (left < right && arr[right] >= pivot) right--;
            arr[left] = arr[right];
            
            while (left < right && arr[left] <= pivot) left++;
            arr[right] = arr[left];
        }
        
        arr[left] = pivot;
        return left;
    }
    
    private void swap(int[] arr, int i, int j) {
        if (i != j) {
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    
    @Override
    public String getName() {
        return "快速排序";
    }
}

/**
 * 冒泡排序策略实现
 */
class BubbleSortStrategy implements SortStrategy {
    @Override
    public void sort(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    swap(arr, j, j + 1);
                    swapped = true;
                }
            }
            // 如果这一轮没有发生交换，说明已经有序
            if (!swapped) {
                break;
            }
        }
    }
    
    private void swap(int[] arr, int i, int j) {
        if (i != j) {
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    
    @Override
    public String getName() {
        return "冒泡排序";
    }
}

/**
 * 插入排序策略实现
 */
class InsertionSortStrategy implements SortStrategy {
    @Override
    public void sort(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        
        for (int i = 1; i < arr.length; i++) {
            int key = arr[i];
            int j = i - 1;
            
            // 将大于 key 的元素向后移动
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            
            arr[j + 1] = key;
        }
    }
    
    @Override
    public String getName() {
        return "插入排序";
    }
}

/**
 * 归并排序策略实现
 */
class MergeSortStrategy implements SortStrategy {
    @Override
    public void sort(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        int[] temp = new int[arr.length];
        mergeSort(arr, temp, 0, arr.length - 1);
    }
    
    private void mergeSort(int[] arr, int[] temp, int left, int right) {
        if (left >= right) {
            return;
        }
        
        int mid = left + (right - left) / 2;
        mergeSort(arr, temp, left, mid);
        mergeSort(arr, temp, mid + 1, right);
        merge(arr, temp, left, mid, right);
    }
    
    private void merge(int[] arr, int[] temp, int left, int mid, int right) {
        // 复制到临时数组
        for (int i = left; i <= right; i++) {
            temp[i] = arr[i];
        }
        
        int i = left, j = mid + 1, k = left;
        
        // 合并两个有序子数组
        while (i <= mid && j <= right) {
            if (temp[i] <= temp[j]) {
                arr[k++] = temp[i++];
            } else {
                arr[k++] = temp[j++];
            }
        }
        
        // 复制剩余元素
        while (i <= mid) {
            arr[k++] = temp[i++];
        }
        while (j <= right) {
            arr[k++] = temp[j++];
        }
    }
    
    @Override
    public String getName() {
        return "归并排序";
    }
}

/**
 * 排序上下文类
 * 封装排序策略，提供统一的排序接口
 */
class SortingContext {
    private SortStrategy strategy;
    
    public SortingContext() {
        // 默认使用快速排序
        this.strategy = new QuickSortStrategy();
    }
    
    public SortingContext(SortStrategy strategy) {
        this.strategy = strategy;
    }
    
    /**
     * 设置排序策略
     * @param strategy 排序策略
     */
    public void setStrategy(SortStrategy strategy) {
        this.strategy = strategy;
    }
    
    /**
     * 执行排序
     * @param arr 待排序数组
     */
    public void sort(int[] arr) {
        if (arr == null) {
            return;
        }
        strategy.sort(arr);
    }
    
    /**
     * 获取当前排序策略名称
     * @return 策略名称
     */
    public String getCurrentStrategyName() {
        return strategy.getName();
    }
    
    /**
     * 获取当前排序策略
     * @return 当前策略对象
     */
    public SortStrategy getCurrentStrategy() {
        return strategy;
    }
}

/**
 * 排序算法工厂类
 * 便于创建不同类型的排序策略
 */
class SortStrategyFactory {
    public enum SortType {
        QUICK_SORT,
        BUBBLE_SORT,
        INSERTION_SORT,
        MERGE_SORT
    }
    
    public static SortStrategy createStrategy(SortType type) {
        switch (type) {
            case QUICK_SORT:
                return new QuickSortStrategy();
            case BUBBLE_SORT:
                return new BubbleSortStrategy();
            case INSERTION_SORT:
                return new InsertionSortStrategy();
            case MERGE_SORT:
                return new MergeSortStrategy();
            default:
                throw new IllegalArgumentException("Unsupported sort type: " + type);
        }
    }
}

/**
 * 策略模式排序框架测试类
 */
public class StrategyPatternSort {
    public static void main(String[] args) {
        System.out.println("=== 策略模式排序框架测试 ===\n");
        
        // 测试数据
        int[] originalData = {64, 34, 25, 12, 22, 11, 90, 5, 77, 30};
        
        // 1. 使用默认策略（快速排序）
        System.out.println("1. 使用默认策略（快速排序）：");
        int[] arr1 = Arrays.copyOf(originalData, originalData.length);
        SortingContext context = new SortingContext();
        System.out.println("排序前：" + Arrays.toString(arr1));
        context.sort(arr1);
        System.out.println("排序后：" + Arrays.toString(arr1));
        System.out.println("使用策略：" + context.getCurrentStrategyName());
        System.out.println();
        
        // 2. 动态切换策略（冒泡排序）
        System.out.println("2. 动态切换策略（冒泡排序）：");
        int[] arr2 = Arrays.copyOf(originalData, originalData.length);
        context.setStrategy(new BubbleSortStrategy());
        System.out.println("排序前：" + Arrays.toString(arr2));
        context.sort(arr2);
        System.out.println("排序后：" + Arrays.toString(arr2));
        System.out.println("使用策略：" + context.getCurrentStrategyName());
        System.out.println();
        
        // 3. 动态切换策略（插入排序）
        System.out.println("3. 动态切换策略（插入排序）：");
        int[] arr3 = Arrays.copyOf(originalData, originalData.length);
        context.setStrategy(new InsertionSortStrategy());
        System.out.println("排序前：" + Arrays.toString(arr3));
        context.sort(arr3);
        System.out.println("排序后：" + Arrays.toString(arr3));
        System.out.println("使用策略：" + context.getCurrentStrategyName());
        System.out.println();
        
        // 4. 使用工厂模式创建策略
        System.out.println("4. 使用工厂模式创建策略（归并排序）：");
        int[] arr4 = Arrays.copyOf(originalData, originalData.length);
        context.setStrategy(SortStrategyFactory.createStrategy(SortStrategyFactory.SortType.MERGE_SORT));
        System.out.println("排序前：" + Arrays.toString(arr4));
        context.sort(arr4);
        System.out.println("排序后：" + Arrays.toString(arr4));
        System.out.println("使用策略：" + context.getCurrentStrategyName());
        System.out.println();
        
        // 5. 性能对比测试
        System.out.println("5. 性能对比测试：");
        performanceComparison(originalData);
        
        // 6. 验证开闭原则 - 演示如何添加新算法
        System.out.println("6. 演示开闭原则 - 添加新排序算法：");
        demonstrateOpenClosedPrinciple();
    }
    
    /**
     * 性能对比测试
     */
    private static void performanceComparison(int[] originalData) {
        SortStrategy[] strategies = {
            new QuickSortStrategy(),
            new BubbleSortStrategy(),
            new InsertionSortStrategy(),
            new MergeSortStrategy()
        };
        
        String[] strategyNames = {
            "快速排序",
            "冒泡排序", 
            "插入排序",
            "归并排序"
        };
        
        for (int i = 0; i < strategies.length; i++) {
            int[] testData = Arrays.copyOf(originalData, originalData.length);
            
            long startTime = System.nanoTime();
            strategies[i].sort(testData);
            long endTime = System.nanoTime();
            
            System.out.printf("%s: %d ns, 结果: %s\n", 
                strategyNames[i], 
                endTime - startTime, 
                isValidSorted(testData) ? "✓" : "✗");
        }
        System.out.println();
    }
    
    /**
     * 验证数组是否已排序
     */
    private static boolean isValidSorted(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] < arr[i - 1]) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 演示开闭原则 - 如何添加新算法而无需修改现有代码
     */
    private static void demonstrateOpenClosedPrinciple() {
        System.out.println("为了添加新排序算法，只需：");
        System.out.println("1. 创建新策略类，实现 SortStrategy 接口");
        System.out.println("2. （可选）在工厂类中添加对应枚举和创建方法");
        System.out.println("3. 现有代码无需任何修改！");
        System.out.println();
        
        // 示例：创建一个选择排序策略（演示开闭原则）
        SortStrategy selectionSort = new SelectionSortStrategy();
        int[] testData = {5, 2, 8, 1, 9};
        System.out.println("使用新添加的选择排序算法：");
        System.out.println("排序前：" + Arrays.toString(testData));
        selectionSort.sort(testData);
        System.out.println("排序后：" + Arrays.toString(testData));
        System.out.println("算法名称：" + selectionSort.getName());
    }
}

/**
 * 选择排序策略 - 演示如何添加新算法（符合开闭原则）
 */
class SelectionSortStrategy implements SortStrategy {
    @Override
    public void sort(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIndex = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIndex]) {
                    minIndex = j;
                }
            }
            if (minIndex != i) {
                swap(arr, i, minIndex);
            }
        }
    }
    
    private void swap(int[] arr, int i, int j) {
        if (i != j) {
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    
    @Override
    public String getName() {
        return "选择排序";
    }
}