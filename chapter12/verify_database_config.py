#!/usr/bin/env python3
"""
数据库配置验证脚本
验证 Qdrant、Neo4j 和本地 Embedding 的连接
"""

import sys
import time
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent))

def print_header(title: str):
    """打印标题"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_result(name: str, success: bool, message: str = ""):
    """打印测试结果"""
    status = "✅ 成功" if success else "❌ 失败"
    print(f"\n{name}: {status}")
    if message:
        print(f"  {message}")

def check_qdrant():
    """检查 Qdrant 连接"""
    print_header("检查 Qdrant 向量数据库")
    
    try:
        from qdrant_client import QdrantClient
        
        print("正在连接到 Qdrant (http://localhost:6333)...")
        client = QdrantClient(host="localhost", port=6333, timeout=10)
        
        # 获取集合列表
        collections = client.get_collections()
        print(f"  当前集合数：{len(collections.collections)}")
        
        # 测试创建集合
        test_collection = "test_health_check"
        try:
            client.create_collection(
                collection_name=test_collection,
                vectors_config={"size": 4, "distance": "cosine"}
            )
            print(f"  ✅ 测试集合创建成功：{test_collection}")
            
            # 删除测试集合
            client.delete_collection(collection_name=test_collection)
            print(f"  ✅ 测试集合删除成功")
        except Exception as e:
            print(f"  ⚠️  集合操作测试：{e}")
        
        client.close()
        print_result("Qdrant 连接", True, "服务运行正常")
        return True
        
    except ImportError:
        print_result("Qdrant 连接", False, "未安装 qdrant-client: pip install qdrant-client")
        return False
    except Exception as e:
        print_result("Qdrant 连接", False, f"{e}\n请确保 Docker 容器已启动：docker-compose up -d qdrant")
        return False

def check_neo4j():
    """检查 Neo4j 连接"""
    print_header("检查 Neo4j 图数据库")
    
    try:
        from neo4j import GraphDatabase
        
        uri = "bolt://localhost:7687"
        username = "neo4j"
        password = "hello-agents-password"
        
        print(f"正在连接到 Neo4j ({uri})...")
        driver = GraphDatabase.driver(uri, auth=(username, password))
        
        # 验证连接
        driver.verify_connectivity()
        print("  ✅ 连接验证成功")
        
        # 执行测试查询
        with driver.session(database="neo4j") as session:
            result = session.run("MATCH (n) RETURN count(n) as count")
            record = result.single()
            count = record["count"] if record else 0
            print(f"  当前节点数：{count}")
            
            # 测试写入
            session.run("CREATE (test:HealthCheck {timestamp: datetime()})")
            print("  ✅ 测试写入成功")
            
            # 清理测试数据
            session.run("MATCH (test:HealthCheck) DELETE test")
            print("  ✅ 测试数据清理成功")
        
        driver.close()
        print_result("Neo4j 连接", True, "服务运行正常")
        return True
        
    except ImportError:
        print_result("Neo4j 连接", False, "未安装 neo4j: pip install neo4j")
        return False
    except Exception as e:
        print_result("Neo4j 连接", False, f"{e}\n请确保 Docker 容器已启动：docker-compose up -d neo4j")
        return False

def check_embedding():
    """检查 Embedding 配置"""
    print_header("检查 Embedding 配置")
    
    try:
        from hello_agents.memory.embedding import get_text_embedder, get_dimension
        
        print("正在加载 Embedding 模型...")
        embedder = get_text_embedder()
        dimension = get_dimension()
        
        print(f"  模型类型：{type(embedder).__name__}")
        print(f"  向量维度：{dimension}")
        
        # 测试编码
        test_text = "Hello Agents embedding test"
        print(f"  测试文本：{test_text}")
        
        embedding = embedder.encode(test_text)
        print(f"  ✅ 编码成功，向量维度：{len(embedding)}")
        
        # 测试批量编码
        batch = ["文本 1", "文本 2", "文本 3"]
        embeddings = embedder.encode(batch)
        print(f"  ✅ 批量编码成功：{len(embeddings)} 个向量")
        
        print_result("Embedding", True, f"模型加载成功，维度={dimension}")
        return True
        
    except Exception as e:
        print_result("Embedding", False, f"{e}")
        return False

def check_env_config():
    """检查环境变量配置"""
    print_header("检查环境变量配置")
    
    from dotenv import load_dotenv
    import os
    
    load_dotenv()
    
    checks = {
        "QDRANT_URL": os.getenv("QDRANT_URL"),
        "QDRANT_COLLECTION": os.getenv("QDRANT_COLLECTION"),
        "NEO4J_URI": os.getenv("NEO4J_URI"),
        "NEO4J_USERNAME": os.getenv("NEO4J_USERNAME"),
        "EMBED_MODEL_TYPE": os.getenv("EMBED_MODEL_TYPE"),
        "EMBED_MODEL_NAME": os.getenv("EMBED_MODEL_NAME"),
    }
    
    all_configured = True
    for key, value in checks.items():
        status = "✅" if value else "⚠️ "
        print(f"  {status} {key}: {value or '(未设置)'}")
        if not value and key in ["QDRANT_URL", "NEO4J_URI"]:
            all_configured = False
    
    print_result("环境配置", all_configured)
    return all_configured

def main():
    """主函数"""
    print_header("HelloAgents 本地数据库配置验证")
    print("\n本脚本将验证以下服务的连接:")
    print("  1. Qdrant 向量数据库 (http://localhost:6333)")
    print("  2. Neo4j 图数据库 (bolt://localhost:7687)")
    print("  3. Embedding 模型 (本地/DashScope)")
    
    print("\n⏳ 请确保已启动 Docker 容器:")
    print("   docker-compose up -d")
    
    # 等待用户确认
    try:
        response = input("\n是否继续验证？(Y/n): ").strip().lower()
        if response in ['n', 'no']:
            print("验证已取消")
            return
    except:
        pass
    
    results = {}
    
    # 检查环境配置
    results["env"] = check_env_config()
    
    # 检查 Qdrant
    time.sleep(1)
    results["qdrant"] = check_qdrant()
    
    # 检查 Neo4j
    time.sleep(1)
    results["neo4j"] = check_neo4j()
    
    # 检查 Embedding
    time.sleep(1)
    results["embedding"] = check_embedding()
    
    # 汇总结果
    print_header("验证结果汇总")
    
    total = len(results)
    passed = sum(results.values())
    
    for name, success in results.items():
        status = "✅" if success else "❌"
        print(f"  {status} {name}: {'通过' if success else '失败'}")
    
    print(f"\n总计：{passed}/{total} 通过")
    
    if passed == total:
        print("\n🎉 所有服务连接正常！可以开始使用 HelloAgents 了。")
        print("\n下一步:")
        print("  1. 运行测试：python -m pytest tests/ -v")
        print("  2. 启动应用：python 01_basic_agent_example.py")
        return 0
    else:
        print("\n⚠️  部分服务未通过验证，请检查:")
        if not results.get("qdrant"):
            print("  - Qdrant: docker-compose up -d qdrant")
        if not results.get("neo4j"):
            print("  - Neo4j: docker-compose up -d neo4j")
        if not results.get("embedding"):
            print("  - Embedding: 检查 .env 中的 EMBED_MODEL_TYPE 配置")
        return 1

if __name__ == "__main__":
    sys.exit(main())
