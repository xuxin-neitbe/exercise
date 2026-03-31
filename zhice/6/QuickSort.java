import java.util.Random;

/**
 * 快速排序算法实现
 * 包含多种优化版本
 */
public class QuickSort {
    
    private static final Random RANDOM = new Random();
    
    /**
     * 方法一：基础快速排序（固定基准值）
     * 时间复杂度：平均 O(nlogn)，最坏 O(n²)
     * 空间复杂度：O(logn)
     */
    public static void sortBasic(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        quickSortBasic(arr, 0, arr.length - 1);
    }
    
    private static void quickSortBasic(int[] arr, int left, int right) {
        if (left >= right) {
            return;
        }
        
        int pivotIndex = partitionBasic(arr, left, right);
        quickSortBasic(arr, left, pivotIndex - 1);
        quickSortBasic(arr, pivotIndex + 1, right);
    }
    
    private static int partitionBasic(int[] arr, int left, int right) {
        int pivot = arr[left]; // 固定选择第一个元素作为基准
        
        while (left < right) {
            // 从右向左找第一个小于 pivot 的元素
            while (left < right && arr[right] >= pivot) {
                right--;
            }
            arr[left] = arr[right];
            
            // 从左向右找第一个大于 pivot 的元素
            while (left < right && arr[left] <= pivot) {
                left++;
            }
            arr[right] = arr[left];
        }
        
        arr[left] = pivot;
        return left;
    }
    
    /**
     * 方法二：随机化快速排序（优化基准值选择）⭐ 推荐
     * 通过随机选择基准值，降低最坏情况概率
     * 时间复杂度：平均 O(nlogn)，最坏 O(n²)（但概率极低）
     * 空间复杂度：O(logn)
     */
    public static void sortRandomized(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        quickSortRandomized(arr, 0, arr.length - 1);
    }
    
    private static void quickSortRandomized(int[] arr, int left, int right) {
        if (left >= right) {
            return;
        }
        
        // 随机选择基准值
        int randomIndex = left + RANDOM.nextInt(right - left + 1);
        swap(arr, left, randomIndex);
        
        int pivotIndex = partitionBasic(arr, left, right);
        quickSortRandomized(arr, left, pivotIndex - 1);
        quickSortRandomized(arr, pivotIndex + 1, right);
    }
    
    /**
     * 方法三：三数取中快速排序（优化基准值选择）⭐⭐ 推荐
     * 选择 left、mid、right 三个位置的中位数作为基准值
     * 时间复杂度：平均 O(nlogn)
     * 空间复杂度：O(logn)
     */
    public static void sortMedianOfThree(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        quickSortMedianOfThree(arr, 0, arr.length - 1);
    }
    
    private static void quickSortMedianOfThree(int[] arr, int left, int right) {
        if (left >= right) {
            return;
        }
        
        // 三数取中选择基准值
        int mid = left + (right - left) / 2;
        int pivotIndex = medianOfThree(arr, left, mid, right);
        swap(arr, left, pivotIndex);
        
        int pivot = partitionBasic(arr, left, right);
        quickSortMedianOfThree(arr, left, pivot - 1);
        quickSortMedianOfThree(arr, pivot + 1, right);
    }
    
    private static int medianOfThree(int[] arr, int i, int j, int k) {
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
    
    /**
     * 方法四：三路快速排序（处理大量重复元素）⭐⭐⭐ 最优
     * 将数组分为 < pivot、= pivot、> pivot 三部分
     * 时间复杂度：平均 O(nlogn)，对于大量重复元素接近 O(n)
     * 空间复杂度：O(logn)
     */
    public static void sort3Way(int[] arr) {
        if (arr == null || arr.length <= 1) {
            return;
        }
        quickSort3Way(arr, 0, arr.length - 1);
    }
    
    private static void quickSort3Way(int[] arr, int left, int right) {
        if (left >= right) {
            return;
        }
        
        // 随机选择基准值
        int randomIndex = left + RANDOM.nextInt(right - left + 1);
        swap(arr, left, randomIndex);
        
        int pivot = arr[left];
        int lt = left;      // arr[left...lt] < pivot
        int gt = right + 1; // arr[gt...right] > pivot
        int i = left + 1;   // arr[lt+1...i-1] = pivot
        
        while (i < gt) {
            if (arr[i] < pivot) {
                swap(arr, i, lt + 1);
                i++;
                lt++;
            } else if (arr[i] > pivot) {
                swap(arr, i, gt - 1);
                gt--;
            } else {
                i++;
            }
        }
        
        // 将 pivot 放到正确位置
        swap(arr, left, lt);
        
        // 递归排序 < pivot 和 > pivot 的部分
        quickSort3Way(arr, left, lt - 1);
        quickSort3Way(arr, gt, right);
    }
    
    /**
     * 辅助方法：交换数组元素
     */
    private static void swap(int[] arr, int i, int j) {
        if (i != j) {
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    
    /**
     * 辅助方法：打印数组
     */
    private static void printArray(int[] arr) {
        for (int num : arr) {
            System.out.print(num + " ");
        }
        System.out.println();
    }
    
    /**
     * 辅助方法：检查数组是否有序
     */
    private static boolean isSorted(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] < arr[i - 1]) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 辅助方法：复制数组
     */
    private static int[] copyArray(int[] arr) {
        if (arr == null) return null;
        int[] copy = new int[arr.length];
        System.arraycopy(arr, 0, copy, 0, arr.length);
        return copy;
    }
    
    public static void main(String[] args) {
        System.out.println("=== 测试 1：基本排序测试 ===\n");
        testBasicSort();
        
        System.out.println("\n=== 测试 2：重复元素测试 ===\n");
        testDuplicateElements();
        
        System.out.println("\n=== 测试 3：边界情况测试 ===\n");
        testEdgeCases();
        
        System.out.println("\n=== 测试 4：性能对比测试 ===\n");
        testPerformance();
    }
    
    /**
     * 测试基本排序功能
     */
    private static void testBasicSort() {
        int[] arr1 = {64, 34, 25, 12, 22, 11, 90};
        System.out.println("原始数组：");
        printArray(arr1);
        
        int[] arr2 = copyArray(arr1);
        sortRandomized(arr2);
        System.out.println("随机化快排：");
        printArray(arr2);
        System.out.println("是否有序：" + isSorted(arr2));
        
        int[] arr3 = copyArray(arr1);
        sortMedianOfThree(arr3);
        System.out.println("三数取中快排：");
        printArray(arr3);
        System.out.println("是否有序：" + isSorted(arr3));
        
        int[] arr4 = copyArray(arr1);
        sort3Way(arr4);
        System.out.println("三路快排：");
        printArray(arr4);
        System.out.println("是否有序：" + isSorted(arr4));
    }
    
    /**
     * 测试重复元素
     */
    private static void testDuplicateElements() {
        int[] arr = {5, 2, 5, 8, 1, 5, 9, 5, 3, 5};
        System.out.println("原始数组（大量重复元素）：");
        printArray(arr);
        
        int[] arr2 = copyArray(arr);
        sort3Way(arr2);
        System.out.println("三路快排结果：");
        printArray(arr2);
        System.out.println("是否有序：" + isSorted(arr2));
    }
    
    /**
     * 测试边界情况
     */
    private static void testEdgeCases() {
        // 空数组
        int[] empty = {};
        sortRandomized(empty);
        System.out.println("空数组测试：通过");
        
        // 单元素数组
        int[] single = {42};
        sortRandomized(single);
        System.out.println("单元素数组测试：通过");
        
        // 已排序数组
        int[] sorted = {1, 2, 3, 4, 5};
        sortRandomized(sorted);
        System.out.println("已排序数组测试：" + isSorted(sorted));
        
        // 逆序数组
        int[] reverse = {5, 4, 3, 2, 1};
        sortRandomized(reverse);
        System.out.println("逆序数组测试：" + isSorted(reverse));
        
        // 所有元素相同
        int[] same = {7, 7, 7, 7, 7};
        sort3Way(same);
        System.out.println("相同元素测试：" + isSorted(same));
        
        // 负数数组
        int[] negative = {-5, -2, -8, -1, -9};
        sortRandomized(negative);
        System.out.println("负数数组测试：" + isSorted(negative));
        printArray(negative);
    }
    
    /**
     * 性能对比测试
     */
    private static void testPerformance() {
        int[] sizes = {100, 1000, 5000};
        
        for (int size : sizes) {
            System.out.println("\n数组大小：" + size);
            
            // 生成随机数组
            int[] randomArr = new int[size];
            for (int i = 0; i < size; i++) {
                randomArr[i] = RANDOM.nextInt(10000);
            }
            
            // 测试随机化快排
            int[] arr1 = copyArray(randomArr);
            long start1 = System.nanoTime();
            sortRandomized(arr1);
            long end1 = System.nanoTime();
            
            // 测试三数取中快排
            int[] arr2 = copyArray(randomArr);
            long start2 = System.nanoTime();
            sortMedianOfThree(arr2);
            long end2 = System.nanoTime();
            
            // 测试三路快排
            int[] arr3 = copyArray(randomArr);
            long start3 = System.nanoTime();
            sort3Way(arr3);
            long end3 = System.nanoTime();
            
            System.out.println("  随机化快排：" + (end1 - start1) / 1000 + " μs");
            System.out.println("  三数取中快排：" + (end2 - start2) / 1000 + " μs");
            System.out.println("  三路快排：" + (end3 - start3) / 1000 + " μs");
            System.out.println("  验证正确性：" + (isSorted(arr1) && isSorted(arr2) && isSorted(arr3) ? "✓" : "✗"));
        }
        
        // 测试大量重复元素的情况
        System.out.println("\n大量重复元素测试 (size=10000)：");
        int[] duplicateArr = new int[10000];
        for (int i = 0; i < 10000; i++) {
            duplicateArr[i] = RANDOM.nextInt(10); // 只有 0-9 十个值
        }
        
        int[] arr1 = copyArray(duplicateArr);
        long start1 = System.nanoTime();
        sortRandomized(arr1);
        long end1 = System.nanoTime();
        
        int[] arr2 = copyArray(duplicateArr);
        long start2 = System.nanoTime();
        sort3Way(arr2);
        long end2 = System.nanoTime();
        
        System.out.println("  随机化快排：" + (end1 - start1) / 1000 + " μs");
        System.out.println("  三路快排：" + (end2 - start2) / 1000 + " μs (对重复元素更优)");
        System.out.println("  验证正确性：" + (isSorted(arr1) && isSorted(arr2) ? "✓" : "✗"));
    }
}