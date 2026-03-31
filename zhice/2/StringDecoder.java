import java.util.Stack;

public class StringDecoder {
    
    public String decodeString(String s) {
        // 使用两个栈：一个存储重复次数，一个存储当前构建的字符串
        Stack<Integer> countStack = new Stack<>();
        Stack<StringBuilder> stringStack = new Stack<>();
        
        StringBuilder currentString = new StringBuilder();
        int currentCount = 0;
        
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) {
                // 构建数字（可能有多位数）
                currentCount = currentCount * 10 + (c - '0');
            } else if (c == '[') {
                // 遇到左括号，将当前计数和字符串压栈
                countStack.push(currentCount);
                stringStack.push(currentString);
                // 重置计数和字符串，开始处理新的嵌套层
                currentCount = 0;
                currentString = new StringBuilder();
            } else if (c == ']') {
                // 遇到右括号，弹出栈顶的计数和字符串
                int repeatTimes = countStack.pop();
                StringBuilder decodedString = stringStack.pop();
                
                // 将当前字符串重复指定次数，并添加到上一层的字符串中
                for (int i = 0; i < repeatTimes; i++) {
                    decodedString.append(currentString);
                }
                currentString = decodedString;
            } else if (Character.isLetter(c)) {
                // 字母直接添加到当前字符串
                currentString.append(c);
            }
            // 忽略其他字符（如空格）
        }
        
        return currentString.toString();
    }
    
    // 递归解法
    public String decodeStringRecursive(String s) {
        return decodeHelper(s, new int[]{0});
    }
    
    private String decodeHelper(String s, int[] index) {
        StringBuilder result = new StringBuilder();
        int count = 0;
        
        while (index[0] < s.length()) {
            char c = s.charAt(index[0]);
            
            if (Character.isDigit(c)) {
                // 构建数字
                count = count * 10 + (c - '0');
            } else if (c == '[') {
                // 进入嵌套层
                index[0]++; // 跳过 '['
                String decoded = decodeHelper(s, index);
                
                // 重复解码后的字符串
                for (int i = 0; i < count; i++) {
                    result.append(decoded);
                }
                count = 0; // 重置计数
            } else if (c == ']') {
                // 返回当前层的结果
                return result.toString();
            } else if (Character.isLetter(c)) {
                result.append(c);
            }
            // 忽略其他字符
            
            index[0]++;
        }
        
        return result.toString();
    }
    
    public static void main(String[] args) {
        StringDecoder decoder = new StringDecoder();
        
        // 测试用例 1
        String s1 = "3[a2[c]]";
        System.out.println("输入: " + s1);
        System.out.println("迭代输出: " + decoder.decodeString(s1));
        System.out.println("递归输出: " + decoder.decodeStringRecursive(s1));
        System.out.println("预期：accaccacc");
        System.out.println();
        
        // 测试用例 2
        String s2 = "2[abc]3[cd]ef";
        System.out.println("输入: " + s2);
        System.out.println("迭代输出: " + decoder.decodeString(s2));
        System.out.println("递归输出: " + decoder.decodeStringRecursive(s2));
        System.out.println("预期：abcabccdcdcdef");
        System.out.println();
        
        // 测试用例 3
        String s3 = "10[a]";
        System.out.println("输入: " + s3);
        System.out.println("迭代输出: " + decoder.decodeString(s3));
        System.out.println("递归输出: " + decoder.decodeStringRecursive(s3));
        System.out.println("预期：aaaaaaaaaa");
        System.out.println();
        
        // 测试用例 4
        String s4 = "2[3[a]b]";
        System.out.println("输入: " + s4);
        System.out.println("迭代输出: " + decoder.decodeString(s4));
        System.out.println("递归输出: " + decoder.decodeStringRecursive(s4));
        System.out.println("预期：aaabaaab");
        System.out.println();
        
        // 测试用例 5
        String s5 = "abc";
        System.out.println("输入: " + s5);
        System.out.println("迭代输出: " + decoder.decodeString(s5));
        System.out.println("递归输出: " + decoder.decodeStringRecursive(s5));
        System.out.println("预期：abc");
        System.out.println();
        
        // 测试用例 6
        String s6 = "3[a] 2[b]";
        System.out.println("输入: " + s6);
        System.out.println("迭代输出: " + decoder.decodeString(s6));
        System.out.println("递归输出: " + decoder.decodeStringRecursive(s6));
        System.out.println("预期：aaabb");
        System.out.println();
        
        // 测试用例 7
        String s7 = "4[2[jk]m1[u]]";
        System.out.println("输入: " + s7);
        System.out.println("迭代输出: " + decoder.decodeString(s7));
        System.out.println("递归输出: " + decoder.decodeStringRecursive(s7));
        System.out.println("预期：jkjkmujkjkmujkjkmujkjkmu");
    }
}