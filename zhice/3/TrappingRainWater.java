public class TrappingRainWater {

    /**
     * 双指针法（最优解）
     * 时间复杂度：O(n)
     * 空间复杂度：O(1)
     * 
     * 核心思想：
     * - 使用两个指针从两端向中间移动
     * - 维护左右两侧的最大高度
     * - 每次移动较矮一侧的指针，因为水量由较矮的一侧决定
     */
    public int trap(int[] height) {
        if (height == null || height.length == 0) {
            return 0;
        }

        int left = 0;
        int right = height.length - 1;
        int leftMax = 0;
        int rightMax = 0;
        int totalWater = 0;

        while (left < right) {
            if (height[left] < height[right]) {
                // 左边较矮，左边能确定水量
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    totalWater += leftMax - height[left];
                }
                left++;
            } else {
                // 右边较矮，右边能确定水量
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    totalWater += rightMax - height[right];
                }
                right--;
            }
        }

        return totalWater;
    }

    // 辅助方法：打印高度图和水位
    public void printHeightMap(int[] height) {
        if (height == null || height.length == 0)
            return;

        int maxHeight = 0;
        for (int h : height) {
            maxHeight = Math.max(maxHeight, h);
        }

        // 计算每个位置的水位
        int n = height.length;
        int[] leftMaxArr = new int[n];
        int[] rightMaxArr = new int[n];

        leftMaxArr[0] = height[0];
        for (int i = 1; i < n; i++) {
            leftMaxArr[i] = Math.max(leftMaxArr[i - 1], height[i]);
        }

        rightMaxArr[n - 1] = height[n - 1];
        for (int i = n - 2; i >= 0; i--) {
            rightMaxArr[i] = Math.max(rightMaxArr[i + 1], height[i]);
        }

        // 打印
        for (int level = maxHeight; level >= 1; level--) {
            for (int i = 0; i < n; i++) {
                int waterLevel = Math.min(leftMaxArr[i], rightMaxArr[i]);
                if (height[i] >= level) {
                    System.out.print("█");
                } else if (waterLevel >= level) {
                    System.out.print("≈");
                } else {
                    System.out.print(" ");
                }
            }
            System.out.println();
        }

        // 打印底部
        for (int i = 0; i < n; i++) {
            System.out.print("─");
        }
        System.out.println();

        // 打印索引
        for (int h : height) {
            System.out.print(h);
        }
        System.out.println();
    }

    public static void main(String[] args) {
        TrappingRainWater solver = new TrappingRainWater();

        // 测试用例 1
        int[] height1 = { 0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1 };
        System.out.println("测试用例 1:");
        System.out.println("输入：[0,1,0,2,1,0,1,3,2,1,2,1]");
        solver.printHeightMap(height1);
        System.out.println("\n双指针结果：" + solver.trap(height1));
        System.out.println("预期：6");
        System.out.println();

        // 测试用例 2
        int[] height2 = { 4, 2, 0, 3, 2, 5 };
        System.out.println("测试用例 2:");
        System.out.println("输入：[4,2,0,3,2,5]");
        solver.printHeightMap(height2);
        System.out.println("\n双指针结果：" + solver.trap(height2));
        System.out.println("预期：9");
        System.out.println();

        // 测试用例 3
        int[] height3 = { 0, 1, 2, 3, 4, 5 };
        System.out.println("测试用例 3:");
        System.out.println("输入：[0,1,2,3,4,5]");
        solver.printHeightMap(height3);
        System.out.println("\n双指针结果：" + solver.trap(height3));
        System.out.println("预期：0（单调递增，无法接水）");
        System.out.println();

        // 测试用例 4
        int[] height4 = { 5, 4, 3, 2, 1, 0 };
        System.out.println("测试用例 4:");
        System.out.println("输入：[5,4,3,2,1,0]");
        solver.printHeightMap(height4);
        System.out.println("\n双指针结果：" + solver.trap(height4));
        System.out.println("预期：0（单调递减，无法接水）");
        System.out.println();

        // 测试用例 5
        int[] height5 = { 2, 0, 2 };
        System.out.println("测试用例 5:");
        System.out.println("输入：[2,0,2]");
        solver.printHeightMap(height5);
        System.out.println("\n双指针结果：" + solver.trap(height5));
        System.out.println("预期：2");
    }
}