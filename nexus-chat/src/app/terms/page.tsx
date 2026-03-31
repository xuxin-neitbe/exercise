/**
 * 服务条款页面
 *
 * 用户使用本服务的法律协议
 */
import type { Metadata } from 'next'

import styles from '../privacy/legal.module.css'

export const metadata: Metadata = {
    title: '服务条款 - Nexus Chat',
    description: 'Nexus Chat 服务条款，使用本服务前请仔细阅读',
}

export default function TermsPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>服务条款</h1>
                <p className={styles.updateDate}>最后更新日期：2024年1月</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2>1. 服务协议</h2>
                    <p>
                        欢迎使用 Nexus Chat（以下简称"本服务"）。本服务条款（以下简称"本条款"）
                        是您与 Nexus Chat 运营方（以下简称"我们"）之间的法律协议。
                    </p>
                    <p>
                        使用本服务即表示您同意接受本条款的约束。如果您不同意本条款的任何内容，
                        请立即停止使用本服务。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. 服务描述</h2>
                    <p>Nexus Chat 是一款即时通讯应用，提供以下功能：</p>
                    <ul>
                        <li>点对点即时消息发送和接收</li>
                        <li>群组聊天功能</li>
                        <li>好友管理和社交功能</li>
                        <li>AI 对话建议辅助功能（可选）</li>
                        <li>文件传输功能</li>
                    </ul>
                    <p>
                        我们保留随时修改、暂停或终止服务的权利，恕不另行通知。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>3. 账户注册与使用</h2>
                    <h3>3.1 注册要求</h3>
                    <ul>
                        <li>您必须年满 14 周岁才能注册使用本服务</li>
                        <li>您提供的注册信息必须真实、准确、完整</li>
                        <li>您有责任保持账户信息的更新</li>
                    </ul>

                    <h3>3.2 账户安全</h3>
                    <ul>
                        <li>您有责任保护账户密码的安全</li>
                        <li>不得与他人共享账户</li>
                        <li>发现账户被盗用应立即通知我们</li>
                    </ul>

                    <h3>3.3 账户注销</h3>
                    <p>
                        您可以随时申请注销账户。账户注销后：
                    </p>
                    <ul>
                        <li>您的个人信息将被删除或匿名化处理</li>
                        <li>您发送的消息可能保留在对话方的设备上</li>
                        <li>账户数据无法恢复</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. 用户行为规范</h2>
                    <h3>4.1 禁止行为</h3>
                    <p>使用本服务时，您承诺不从事以下行为：</p>
                    <ul>
                        <li>发布违法、有害、淫秽、暴力或歧视性内容</li>
                        <li>骚扰、威胁或侵害他人权益</li>
                        <li>传播病毒、恶意软件或进行网络攻击</li>
                        <li>冒充他人或虚假陈述身份</li>
                        <li>侵犯他人知识产权或隐私权</li>
                        <li>批量发送垃圾信息或进行网络钓鱼</li>
                        <li>试图破坏或干扰服务正常运行</li>
                        <li>利用服务从事任何违法活动</li>
                    </ul>

                    <h3>4.2 内容责任</h3>
                    <p>
                        您对通过本服务发送的所有内容负责。我们不对用户生成的内容承担任何责任，
                        但有权根据法律法规或本条款删除违规内容。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>5. 知识产权</h2>
                    <h3>5.1 我们的权利</h3>
                    <p>
                        本服务的所有内容，包括但不限于软件、设计、商标、标识、文字、图片等，
                        均受知识产权法保护。未经我们书面许可，您不得复制、修改、传播或用于商业目的。
                    </p>

                    <h3>5.2 您的权利</h3>
                    <p>
                        您通过本服务发送的内容，您保留其知识产权。您授予我们有限的许可，
                        以便我们提供服务（如传输、存储您的消息）。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>6. AI 功能条款</h2>
                    <p>本服务提供的 AI 对话建议功能受以下条款约束：</p>
                    <ul>
                        <li>AI 建议仅供参考，不构成任何建议或意见</li>
                        <li>您对使用 AI 建议发送的内容承担全部责任</li>
                        <li>AI 功能可能存在局限性，不保证准确性</li>
                        <li>我们保留随时调整或终止 AI 功能的权利</li>
                        <li>使用 AI 功能即表示您同意相关隐私政策</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>7. 免责声明</h2>
                    <p>
                        本服务按"现状"提供，不提供任何明示或暗示的保证，包括但不限于：
                    </p>
                    <ul>
                        <li>服务的连续性、安全性或无错误</li>
                        <li>服务结果满足您的特定需求</li>
                        <li>第三方内容的准确性或可靠性</li>
                    </ul>
                    <p>
                        在法律允许的最大范围内，我们不对任何间接、偶然、特殊或后果性损害承担责任，
                        包括但不限于利润损失、数据丢失或业务中断。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>8. 服务变更与终止</h2>
                    <h3>8.1 服务变更</h3>
                    <p>
                        我们保留随时修改或终止服务的权利，恕不另行通知。重大变更将通过应用内通知告知您。
                    </p>

                    <h3>8.2 账户终止</h3>
                    <p>如有以下情况，我们有权暂停或终止您的账户：</p>
                    <ul>
                        <li>违反本条款或相关法律法规</li>
                        <li>从事违法或有害活动</li>
                        <li>长期不活跃账户</li>
                        <li>应法律要求或政府指令</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>9. 争议解决</h2>
                    <p>
                        本条款受中华人民共和国法律管辖。因本条款引起的任何争议，
                        双方应首先通过友好协商解决；协商不成的，任何一方可向我们所在地有管辖权的人民法院提起诉讼。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>10. 条款修改</h2>
                    <p>
                        我们保留随时修改本条款的权利。修改后的条款将在本页面发布，
                        并在发布后立即生效。继续使用本服务即表示您接受修改后的条款。
                    </p>
                    <p>
                        建议您定期查阅本条款以了解最新内容。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>11. 其他条款</h2>
                    <ul>
                        <li><strong>完整协议：</strong>本条款构成您与我们之间关于使用本服务的完整协议</li>
                        <li><strong>可分割性：</strong>如本条款任何条款被认定无效，不影响其他条款的效力</li>
                        <li><strong>权利保留：</strong>我们未行使任何权利不构成对该权利的放弃</li>
                        <li><strong>转让：</strong>未经我们书面同意，您不得转让本条款下的任何权利或义务</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>12. 联系我们</h2>
                    <p>如果您对本服务条款有任何疑问，请通过以下方式联系我们：</p>
                    <ul>
                        <li>电子邮件：legal@nexuschat.example.com</li>
                        <li>地址：[您的公司地址]</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
