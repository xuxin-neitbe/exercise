"""
数据生成场景

使用多智能体生成高质量的训练数据
"""

from camel.agents import ChatAgent
from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType
from camel.messages import BaseMessage
import os
import json
from pathlib import Path


def run_data_generation(
    assistant_role: str = "数据生成专家",
    data_type: str = "问答对",
    num_samples: int = 5,
    max_turns: int = 10,
):
    """
    运行数据生成场景
    
    Args:
        assistant_role: 助手角色名称
        data_type: 数据类型
        num_samples: 生成样本数量
        max_turns: 最大对话轮数
    """
    print("📊 启动数据生成场景\n")
    print(f"助手角色：{assistant_role}")
    print(f"数据类型：{data_type}")
    print(f"目标样本数：{num_samples}\n")
    
    # 创建模型
    model = ModelFactory.create(
        model_platform=ModelPlatformType.OPENAI,
        model_type=ModelType.GPT_4,
        api_key=os.getenv("OPENAI_API_KEY"),
        model_config_dict={"temperature": 0.8},  # 较高温度增加多样性
    )
    
    # 创建数据生成智能体
    generator_sys_msg = BaseMessage.make_assistant_message(
        role_name=assistant_role,
        content=f"你是一个专业的{assistant_role}，负责生成高质量的{data_type}训练数据。"
    )
    
    generator = ChatAgent(
        system_message=generator_sys_msg,
        model=model,
    )
    
    # 创建验证智能体
    validator_sys_msg = BaseMessage.make_assistant_message(
        role_name="数据验证员",
        content="你是严格的数据验证员，负责检查生成数据的质量。"
    )
    
    validator = ChatAgent(
        system_message=validator_sys_msg,
        model=model,
    )
    
    # 创建输出目录
    output_dir = Path("data")
    output_dir.mkdir(exist_ok=True)
    
    generated_data = []
    
    print("=" * 60)
    
    # 生成数据
    for i in range(num_samples):
        print(f"\n📝 生成第 {i+1}/{num_samples} 个样本\n")
        
        # 生成请求
        gen_msg = BaseMessage.make_user_message(
            role_name="User",
            content=f"请生成第 {i+1} 个{data_type}样本，要求高质量、多样化。"
        )
        
        # 生成数据
        gen_response = generator.step(gen_msg)
        generated_content = gen_response.msgs[0].content
        
        print(f"生成的数据:\n{generated_content}\n")
        
        # 验证数据
        val_msg = BaseMessage.make_user_message(
            role_name="User",
            content=f"请验证以下数据的质量:\n{generated_content}\n\n请评分 (1-10) 并提供改进建议。"
        )
        
        val_response = validator.step(val_msg)
        validation_result = val_response.msgs[0].content
        
        print(f"验证结果:\n{validation_result}\n")
        
        # 保存数据
        sample = {
            "id": i + 1,
            "type": data_type,
            "content": generated_content,
            "validation": validation_result,
        }
        
        generated_data.append(sample)
        
        # 保存到文件
        with open(output_dir / f"sample_{i+1:03d}.json", "w", encoding="utf-8") as f:
            json.dump(sample, f, ensure_ascii=False, indent=2)
    
    # 保存汇总文件
    with open(output_dir / "all_data.json", "w", encoding="utf-8") as f:
        json.dump(generated_data, f, ensure_ascii=False, indent=2)
    
    print("=" * 60)
    print("🎉 数据生成完成！")
    print(f"生成样本数：{len(generated_data)}")
    print(f"输出目录：{output_dir.absolute()}\n")
    
    return generated_data
