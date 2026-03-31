/**
 * 隐私政策页面
 *
 * 符合 GDPR 和中国网络安全法要求
 */
import type { Metadata } from 'next'

import styles from './legal.module.css'

export const metadata: Metadata = {
    title: '隐私政策 - Nexus Chat',
    description: 'Nexus Chat 隐私政策，说明我们如何收集、使用和保护您的个人信息',
}

export default function PrivacyPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>隐私政策</h1>
                <p className={styles.updateDate}>最后更新日期：2024年1月</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2>1. 引言</h2>
                    <p>
                        欢迎使用 Nexus Chat（以下简称"我们"或"本服务"）。我们高度重视您的隐私保护，
                        本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。
                    </p>
                    <p>
                        使用本服务即表示您同意本隐私政策的条款。如果您不同意本政策，请停止使用本服务。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. 信息收集</h2>
                    <h3>2.1 我们收集的信息</h3>
                    <ul>
                        <li><strong>账户信息：</strong>用户名、电子邮箱地址、密码（加密存储）</li>
                        <li><strong>通讯内容：</strong>您发送和接收的消息、文件</li>
                        <li><strong>使用数据：</strong>登录时间、设备信息、IP地址</li>
                        <li><strong>可选信息：</strong>头像图片、个人简介</li>
                    </ul>

                    <h3>2.2 信息收集方式</h3>
                    <ul>
                        <li>您主动提供的信息（注册、发送消息等）</li>
                        <li>自动收集的技术信息（Cookies、日志文件）</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. 信息使用</h2>
                    <p>我们使用收集的信息用于：</p>
                    <ul>
                        <li>提供、维护和改进我们的服务</li>
                        <li>处理您的请求和响应</li>
                        <li>发送服务相关通知</li>
                        <li>保障服务安全，防止欺诈行为</li>
                        <li>遵守法律法规要求</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. 信息共享</h2>
                    <p>我们不会出售您的个人信息。我们仅在以下情况下共享信息：</p>
                    <ul>
                        <li><strong>服务提供商：</strong>与帮助我们运营服务的第三方（如云服务提供商）</li>
                        <li><strong>法律要求：</strong>根据法律法规、法院命令或政府要求</li>
                        <li><strong>用户同意：</strong>获得您的明确同意后</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. 信息安全</h2>
                    <p>我们采取以下安全措施保护您的信息：</p>
                    <ul>
                        <li>数据传输加密（HTTPS/TLS）</li>
                        <li>密码哈希存储（bcrypt）</li>
                        <li>访问控制和权限管理</li>
                        <li>定期安全审计</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. 您的权利</h2>
                    <p>根据相关法律法规，您享有以下权利：</p>
                    <ul>
                        <li><strong>访问权：</strong>您可以请求获取我们持有的您的个人信息副本</li>
                        <li><strong>更正权：</strong>您可以请求更正不准确的信息</li>
                        <li><strong>删除权：</strong>您可以请求删除您的个人信息（账号注销）</li>
                        <li><strong>数据可携带权：</strong>您可以请求以结构化格式获取您的数据</li>
                        <li><strong>撤回同意权：</strong>您可以随时撤回之前给予的同意</li>
                    </ul>
                    <p>如需行使上述权利，请通过以下方式联系我们。</p>
                </section>

                <section className={styles.section}>
                    <h2>7. AI 功能说明</h2>
                    <p>本服务提供 AI 对话建议功能，相关说明如下：</p>
                    <ul>
                        <li>AI 建议功能需要将对话上下文发送至第三方 AI 服务提供商</li>
                        <li>我们会对发送的内容进行脱敏处理</li>
                        <li>您可以选择关闭 AI 建议功能</li>
                        <li>AI 服务提供商可能位于中国境外，数据传输符合相关法规要求</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>8. Cookie 政策</h2>
                    <p>我们使用 Cookie 和类似技术来：</p>
                    <ul>
                        <li>保持您的登录状态</li>
                        <li>记住您的偏好设置</li>
                        <li>分析服务使用情况</li>
                    </ul>
                    <p>您可以通过浏览器设置管理 Cookie，但这可能影响某些功能的使用。</p>
                </section>

                <section className={styles.section}>
                    <h2>9. 未成年人保护</h2>
                    <p>
                        本服务不面向 14 周岁以下的未成年人。如果您是 14 周岁以下的未成年人，
                        请不要使用本服务或向我们提供任何个人信息。
                    </p>
                    <p>
                        如果您是 14-18 周岁的未成年人，请在监护人的指导下使用本服务，
                        并在提供个人信息前获得监护人的同意。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>10. 政策更新</h2>
                    <p>
                        我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，
                        重大变更将通过应用内通知或邮件告知您。
                    </p>
                    <p>建议您定期查阅本政策以了解最新的隐私保护措施。</p>
                </section>

                <section className={styles.section}>
                    <h2>11. 联系我们</h2>
                    <p>如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：</p>
                    <ul>
                        <li>电子邮件：privacy@nexuschat.example.com</li>
                        <li>地址：[您的公司地址]</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
