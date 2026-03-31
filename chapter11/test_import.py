import sys
from pathlib import Path
import json

project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from tools.builtin.rl_training_tool import RLTrainingTool

def quick_test():
    tool = RLTrainingTool()
    
    print("="*80)
    print("快速实验测试")
    print("="*80)

    sft_config = {
        "action": "train_sft",
        "model_name_or_path": "Qwen/Qwen3-0.6B",
        "dataset_name": "trl-internal-testing/zen",
        "dataset_text_field": "prompt",
        "learning_rate": 2e-5,
        "num_train_epochs": 1,
        "output_dir": "./outputs/sft"
    }
    
    print("开始SFT训练...")
    sft_result = tool.run(sft_config)
    print("SFT训练结果:", sft_result)

if __name__ == "__main__":
    quick_test()
