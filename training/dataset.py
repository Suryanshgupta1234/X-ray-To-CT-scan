import glob
import random
import os
from torch.utils.data import Dataset
from PIL import Image

class UnpairedDataset(Dataset):
    def __init__(self, root, transforms_=None, unaligned=True, mode="train"):
        self.transform = transforms_
        self.unaligned = unaligned

        # On Kaggle, you will specify root as the folder containing your two domains
        # e.g., root/trainA (X-Rays) and root/trainB (CT Scans)
        self.files_A = sorted(glob.glob(os.path.join(root, f"{mode}A") + "/*.*"))
        self.files_B = sorted(glob.glob(os.path.join(root, f"{mode}B") + "/*.*"))

    def __getitem__(self, index):
        image_A = Image.open(self.files_A[index % len(self.files_A)])

        if self.unaligned:
            image_B = Image.open(self.files_B[random.randint(0, len(self.files_B) - 1)])
        else:
            image_B = Image.open(self.files_B[index % len(self.files_B)])

        # Convert grayscale to RGB
        if image_A.mode != "RGB":
            image_A = image_A.convert("RGB")
        if image_B.mode != "RGB":
            image_B = image_B.convert("RGB")

        if self.transform is not None:
            item_A = self.transform(image_A)
            item_B = self.transform(image_B)

        return {"A": item_A, "B": item_B}

    def __len__(self):
        return max(len(self.files_A), len(self.files_B))
