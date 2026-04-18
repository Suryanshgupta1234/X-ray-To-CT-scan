import os
from PIL import Image, ImageOps, ImageFilter
import numpy as np

# We'll try to import PyTorch, if it fails, we use a PIL-based mock.
try:
    import torch
    import torchvision.transforms as transforms
    HAS_TORCH = True
    
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])
    print("PyTorch successfully loaded in utils.py")
except ImportError:
    HAS_TORCH = False
    print("Warning: PyTorch not found. Falling back to PIL mock generation.")

def tensor2im(input_image):
    if not HAS_TORCH:
        return None
        
    if not isinstance(input_image, torch.Tensor):
        if isinstance(input_image, list):
            input_image = input_image[0]
    if len(input_image.shape) == 4:
        input_image = input_image[0]
    
    image_tensor = input_image.cpu().float()
    image_tensor = (image_tensor + 1) / 2.0 * 255.0
    image_tensor = torch.clamp(image_tensor, 0, 255)
    
    image_numpy = image_tensor.numpy()
    if image_numpy.shape[0] == 1:
        image_numpy = torch.cat([image_tensor, image_tensor, image_tensor], 0).numpy()
    
    image_numpy = np.transpose(image_numpy, (1, 2, 0))
    return image_numpy.astype(np.uint8)

def load_image(image_path):
    return Image.open(image_path).convert('RGB')

def save_image(image_numpy, image_path):
    image_pil = Image.fromarray(image_numpy)
    image_pil.save(image_path)

def preprocess_image(image_path):
    image = load_image(image_path)
    if HAS_TORCH:
        return transform(image).unsqueeze(0)
    return image # return raw PIL image for mock

def postprocess_image(data, output_path, view_type="Coronal"):
    if HAS_TORCH and isinstance(data, torch.Tensor):
        img_array = tensor2im(data)
        save_image(img_array, output_path)
    else:
        # Mock Generation: If data is a PIL Image, apply some 'CT-like' filters
        if isinstance(data, Image.Image):
            mock_ct = data.resize((256, 256))
            mock_ct = ImageOps.grayscale(mock_ct)
            
            if view_type == "Axial":
                # Simulated Axial slice using rotation and embossing differences
                mock_ct = ImageOps.autocontrast(mock_ct, cutoff=3)
                mock_ct = mock_ct.rotate(90, expand=False).filter(ImageFilter.FIND_EDGES)
                mock_ct = ImageOps.invert(mock_ct)
            elif view_type == "Sagittal":
                # Simulated Sagittal slice using solarize / smooth
                mock_ct = ImageOps.solarize(mock_ct, threshold=200)
                mock_ct = mock_ct.filter(ImageFilter.SMOOTH)
                mock_ct = ImageOps.autocontrast(mock_ct, cutoff=1)
            else:
                # Coronal (Default)
                mock_ct = ImageOps.autocontrast(mock_ct, cutoff=2)
                mock_ct = mock_ct.filter(ImageFilter.EDGE_ENHANCE_MORE)
                
            mock_ct.save(output_path)
    return output_path
