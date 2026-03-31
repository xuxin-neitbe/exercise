import matplotlib.pyplot as plt
import pandas as pd
from matplotlib import rcParams

# 设置中文字体
rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'Arial Unicode MS']
rcParams['axes.unicode_minus'] = False

# 投票数据（基于截图中的实际投票者统计）
# 总投票人数：9 人（通过唯一投票者名称统计）
# 注意：截图中的百分比是基于总票数（41 票）计算，不是投票人数
data = {
    '症状改善': [
        '肌肉僵硬改善',
        '整体身体轻松、精神状态变好',
        '肢体震颤改善',
        '动作迟缓改善',
        '步态改善',
        '无药效期症状减轻',
        '脚抽筋、肌肉疼痛改善',
        '冻结步态/起步困难改善',
        '手指精细动作变灵活',
        '药物起效变快/药效时间延长',
        '便秘/大便情况改善',
        '头脑昏沉减轻、头脑更清醒',
        '睡眠质量改善'
    ],
    '票数': [6, 6, 4, 4, 4, 4, 3, 2, 2, 2, 2, 2, 0],
    '占比': [14.6, 14.6, 9.8, 9.8, 9.8, 9.8, 7.3, 4.9, 4.9, 4.9, 4.9, 4.9, 0]
}

# 实际投票者名单（从截图中提取）
voters = {
    '王文娟', '墨香', '鸿运_许友华', '王凤昆', 
    '招财*@猫', 'sunp', '人间四月天', '千芮', '淡雅'
}
total_voters = len(voters)  # 9 人

# 创建 DataFrame
df = pd.DataFrame(data)

# 按票数降序排序
df = df.sort_values('票数', ascending=False)

# 过滤掉 0 票的数据（睡眠质量改善）
df_nonzero = df[df['票数'] > 0]

# 创建糖果风格的饼图
fig, axes = plt.subplots(1, 2, figsize=(18, 8))

# 糖果风格配色方案 - 使用鲜艳的糖果色
candy_colors = [
    '#FF69B4',  # 热粉色
    '#FF1493',  # 深粉色
    '#FF6347',  # 番茄红
    '#FFA07A',  # 淡橙色
    '#FFD700',  # 金色
    '#FFFF00',  # 黄色
    '#ADFF2F',  # 绿黄色
    '#00CED1',  # 深青色
    '#1E90FF',  # 道奇蓝
    '#9370DB',  # 中紫色
    '#DA70D6',  # 兰花紫
    '#FFB6C1',  # 浅粉色
]

# 饼图 1：带百分比标签
ax1 = axes[0]
wedges1, texts1, autotexts1 = ax1.pie(
    df_nonzero['票数'], 
    labels=df_nonzero['症状改善'],
    autopct='%1.1f%%',
    colors=candy_colors[:len(df_nonzero)],
    startangle=90,
    pctdistance=0.75,
    labeldistance=1.05,
    textprops={'fontsize': 9, 'weight': 'bold'},
    wedgeprops={'edgecolor': 'white', 'linewidth': 2, 'antialiased': True}
)

# 美化饼图文字
for autotext in autotexts1:
    autotext.set_color('white')
    autotext.set_fontsize(9)
    autotext.set_weight('bold')

ax1.set_title(f'帕金森病治疗后症状改善投票统计\n(总投票人数：{total_voters}人，总票数：41 票)', 
              fontsize=14, fontweight='bold', pad=20, color='#FF1493')

# 饼图 2：带票数标签的甜甜圈图
ax2 = axes[1]
wedges2, texts2, autotexts2 = ax2.pie(
    df_nonzero['票数'], 
    labels=df_nonzero['症状改善'],
    autopct=lambda p: f'{int(p * sum(df_nonzero["票数"]) / 100)}票',
    colors=candy_colors[:len(df_nonzero)],
    startangle=90,
    pctdistance=0.75,
    labeldistance=1.05,
    textprops={'fontsize': 9, 'weight': 'bold'},
    wedgeprops={'edgecolor': 'white', 'linewidth': 2, 'antialiased': True, 'width': 0.4}
)

# 美化饼图文字
for autotext in autotexts2:
    autotext.set_color('white')
    autotext.set_fontsize(9)
    autotext.set_weight('bold')

ax2.set_title('甜甜圈图版本 (糖果风格)', 
              fontsize=14, fontweight='bold', pad=20, color='#FF69B4')

# 添加中心文字
center_circle = plt.Circle((0, 0), 0.3, fc='white', edgecolor='#FF69B4', linewidth=3)
ax2.add_artist(center_circle)
ax2.text(0, 0, f'41 票\n{total_voters}人', ha='center', va='center', 
         fontsize=12, fontweight='bold', color='#FF1493')

# 调整布局
plt.tight_layout()

# 保存图片
plt.savefig('d:\\Projects\\5minAI\\vote_pie_chart_candy.png', dpi=300, bbox_inches='tight')
plt.savefig('d:\\Projects\\5minAI\\vote_pie_chart_candy.jpg', dpi=300, bbox_inches='tight')

print('糖果风格饼图已生成完成！')
print(f'\n总投票人数：{total_voters}人')
print(f'总票数：41 票（多选投票，每人可投多个选项）')
print(f'\n各症状改善统计（按票数降序排列）:')
print('-' * 60)
for _, row in df.iterrows():
    print(f"{row['症状改善']:<25} {row['票数']:>2}票 ({row['占比']}%)")
