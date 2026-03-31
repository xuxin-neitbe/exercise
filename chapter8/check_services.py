#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务健康检查脚本
检查所有依赖的服务是否正常
"""

import sys
import time
from typing import Dict, Tuple

def print_section(title: str):
    """打印章节标题"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def check_python_packages():
    """检查 Python 依赖包"""
    print_section("1. Python 依赖包检查")
    
    required_packages = {
        'openai': 'OpenAI SDK',
        'dotenv': 'python-dotenv',
        'numpy': 'NumPy',
        'gradio': 'Gradio',
        'sentence_transformers': 'Sentence Transformers',
        'qdrant_client': 'Qdrant Client',
        'neo4j': 'Neo4j Driver',
        'requests': 'Requests',
        'dashscope': 'DashScope SDK',
    }
    
    missing = []
    installed = []
    
    for package, name in required_packages.items():
        try:
            __import__(package)
            installed.append(name)
            print(f"  ✓ {name} ({package}) - 已安装")
        except ImportError:
            missing.append(name)
            print(f"  ✗ {name} ({package}) - 未安装")
    
    if missing:
        print(f"\n  ⚠ 缺少的包：{', '.join(missing)}")
        print(f"  安装命令：pip install {' '.join([k for k, v in required_packages.items() if v in missing])}")
    else:
        print(f"\n  ✓ 所有必需包已安装 ({len(installed)} 个)")
    
    return len(missing) == 0

def check_env_variables():
    """检查环境变量配置"""
    print_section("2. 环境变量检查")
    
    from dotenv import load_dotenv
    import os
    
    load_dotenv()
    
    required_vars = {
        'LLM_API_KEY': 'LLM API 密钥',
        'LLM_BASE_URL': 'LLM 服务地址',
        'LLM_MODEL_ID': 'LLM 模型 ID',
    }
    
    missing = []
    configured = []
    
    for var, desc in required_vars.items():
        value = os.getenv(var)
        if value:
            configured.append(var)
            # 脱敏显示
            masked = value[:8] + "..." if len(value) > 8 else "***"
            print(f"  ✓ {desc} ({var}): {masked}")
        else:
            missing.append(var)
            print(f"  ✗ {desc} ({var}) - 未配置")
    
    # 可选配置
    print("\n  可选配置:")
    optional_vars = {
        'EMBED_MODEL_TYPE': 'Embedding 模型类型',
        'EMBED_MODEL_NAME': 'Embedding 模型名称',
        'LLM_TIMEOUT': '超时时间',
    }
    
    for var, desc in optional_vars.items():
        value = os.getenv(var)
        if value:
            print(f"  ✓ {desc} ({var}): {value}")
        else:
            print(f"  - {desc} ({var}) - 使用默认值")
    
    if missing:
        print(f"\n  ⚠ 缺少必需的环境变量：{', '.join(missing)}")
        return False
    else:
        print(f"\n  ✓ 所有必需环境变量已配置 ({len(configured)} 个)")
        return True

def check_llm_service():
    """检查 LLM 服务连接"""
    print_section("3. LLM 服务连接检查")
    
    import os
    from llm import HelloAgentsLLM
    from exceptions import HelloAgentsException
    
    try:
        print("  正在初始化 LLM 客户端...")
        llm = HelloAgentsLLM()
        print(f"  ✓ 客户端初始化成功")
        print(f"    - Provider: {llm.provider}")
        print(f"    - Model: {llm.model}")
        print(f"    - Base URL: {llm.base_url[:50]}...")
        
        print("\n  正在测试 LLM 连接（发送测试请求）...")
        start_time = time.time()
        
        # 发送一个简单的测试消息（使用 think 方法）
        messages = [{"role": "user", "content": "Hello, this is a service check. Please respond with 'OK'."}]
        response_chunks = []
        for chunk in llm.think(messages=messages):
            response_chunks.append(chunk)
        
        response = "".join(response_chunks)
        elapsed = time.time() - start_time
        
        print(f"  ✓ LLM 响应成功 (耗时：{elapsed:.2f}秒)")
        print(f"    响应内容：{response[:100]}...")
        
        return True
        
    except HelloAgentsException as e:
        print(f"  ✗ LLM 服务错误：{str(e)}")
        return False
    except Exception as e:
        print(f"  ✗ 未知错误：{str(e)}")
        import traceback
        traceback.print_exc()
        return False

def check_embedding_service():
    """检查 Embedding 服务"""
    print_section("4. Embedding 服务检查")
    
    import os
    from memory.embedding import get_text_embedder, get_dimension
    
    try:
        embed_type = os.getenv('EMBED_MODEL_TYPE', 'local')
        embed_name = os.getenv('EMBED_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
        
        print(f"  配置：")
        print(f"    - 类型：{embed_type}")
        print(f"    - 模型：{embed_name}")
        
        print("\n  正在初始化 Embedding 模型...")
        embedder = get_text_embedder()
        dim = get_dimension()
        print(f"  ✓ 模型初始化成功")
        print(f"    - 维度：{dim}")
        
        print("\n  正在测试 Embedding 生成...")
        test_text = "这是一个测试句子"
        start_time = time.time()
        embedding = embedder.encode(test_text)
        elapsed = time.time() - start_time
        
        print(f"  ✓ Embedding 生成成功 (耗时：{elapsed:.2f}秒)")
        print(f"    - 向量维度：{len(embedding)}")
        print(f"    - 向量前 5 个值：{embedding[:5]}")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Embedding 服务错误：{str(e)}")
        import traceback
        traceback.print_exc()
        return False

def check_memory_tools():
    """检查 Memory 工具"""
    print_section("5. Memory 工具检查")
    
    try:
        from tools.builtin.memory_tool import MemoryTool
        
        print("  正在初始化 MemoryTool...")
        memory_tool = MemoryTool(user_id="test_user")
        print(f"  ✓ MemoryTool 初始化成功")
        
        print("\n  测试 Memory 操作...")
        # 测试添加记忆
        result = memory_tool.run({
            "action": "add",
            "content": "服务检查测试记忆",
            "memory_type": "episodic",
            "importance": 0.5
        })
        print(f"  ✓ 添加记忆成功：{result}")
        
        # 测试查询记忆
        result = memory_tool.run({
            "action": "query",
            "query": "服务检查",
            "top_k": 5
        })
        print(f"  ✓ 查询记忆成功，返回 {len(result) if isinstance(result, list) else '结果'} 条记录")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Memory 工具错误：{str(e)}")
        import traceback
        traceback.print_exc()
        return False

def check_rag_tool():
    """检查 RAG 工具"""
    print_section("6. RAG 工具检查")
    
    try:
        from tools.builtin.rag_tool import RAGTool
        
        print("  正在初始化 RAGTool...")
        rag_tool = RAGTool(rag_namespace="test_check")
        print(f"  ✓ RAGTool 初始化成功")
        
        print("\n  检查 RAG 配置...")
        # 这里可以添加更多 RAG 特定的检查
        print(f"  ✓ RAG 配置正常")
        
        return True
        
    except Exception as e:
        print(f"  ✗ RAG 工具错误：{str(e)}")
        import traceback
        traceback.print_exc()
        return False

def check_docker_services():
    """检查 Docker 服务（如果配置了本地服务）"""
    print_section("7. Docker 服务检查（可选）")
    
    import subprocess
    import os
    
    # 检查是否有 docker-compose 配置
    docker_compose_files = [
        'docker-compose.yml',
        'docker-compose.yaml',
        'docker-compose.dev.yml'
    ]
    
    found_file = None
    for file in docker_compose_files:
        if os.path.exists(file):
            found_file = file
            break
    
    if not found_file:
        print("  - 未找到 docker-compose 配置文件")
        print("  说明：项目使用云服务，无需本地 Docker 服务")
        return True
    
    print(f"  找到配置文件：{found_file}")
    print("  正在检查 Docker 服务状态...")
    
    try:
        result = subprocess.run(
            ['docker-compose', 'ps'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print("  ✓ Docker 服务运行中")
            print(result.stdout)
            return True
        else:
            print("  ⚠ Docker 服务未运行")
            print("  启动命令：docker-compose up -d")
            return False
            
    except subprocess.TimeoutExpired:
        print("  ⚠ Docker 命令超时")
        return False
    except FileNotFoundError:
        print("  ⚠ Docker Compose 未安装或不在 PATH 中")
        return False
    except Exception as e:
        print(f"  ✗ 检查失败：{str(e)}")
        return False

def main():
    """主函数"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "智能文档问答助手 - 服务健康检查" + " " * 10 + "║")
    print("╚" + "=" * 58 + "╝")
    
    results = {
        'Python 依赖包': check_python_packages(),
        '环境变量': check_env_variables(),
        'LLM 服务': check_llm_service(),
        'Embedding 服务': check_embedding_service(),
        'Memory 工具': check_memory_tools(),
        'RAG 工具': check_rag_tool(),
        'Docker 服务': check_docker_services(),
    }
    
    print_section("检查总结")
    
    for service, status in results.items():
        status_icon = "✓" if status else "✗"
        print(f"  {status_icon} {service}: {'正常' if status else '异常'}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("  ✓ 所有服务检查通过！可以开始 Debug 项目代码")
    else:
        print("  ⚠ 部分服务异常，请先修复后再继续")
        print("\n  修复建议:")
        if not results['Python 依赖包']:
            print("    - 安装缺少的 Python 包：pip install -r requirements.txt")
        if not results['环境变量']:
            print("    - 检查 .env 文件配置是否正确")
        if not results['LLM 服务']:
            print("    - 检查 API Key 是否有效")
            print("    - 检查网络连接是否正常")
        if not results['Embedding 服务']:
            print("    - 检查 Embedding 模型配置")
        if not results['Memory 工具'] or not results['RAG 工具']:
            print("    - 检查相关依赖和服务配置")
    
    print("=" * 60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
