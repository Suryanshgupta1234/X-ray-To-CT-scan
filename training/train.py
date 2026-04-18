import argparse
import os
import itertools

import torchvision.transforms as transforms
from torch.utils.data import DataLoader
import torch
import torch.nn as nn

from models import GeneratorResNet, Discriminator
from dataset import UnpairedDataset

def train_cyclegan(dataset_path, epochs, batch_size=1, lr=0.0002, img_size=256, checkpoint_dir="saved_models"):
    os.makedirs(checkpoint_dir, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    # Initialize models
    input_shape = (3, img_size, img_size)
    G_AB = GeneratorResNet(input_shape, num_residual_blocks=9).to(device)
    G_BA = GeneratorResNet(input_shape, num_residual_blocks=9).to(device)
    D_A = Discriminator(input_shape).to(device)
    D_B = Discriminator(input_shape).to(device)

    # Losses
    criterion_GAN = torch.nn.MSELoss().to(device)
    criterion_cycle = torch.nn.L1Loss().to(device)
    criterion_identity = torch.nn.L1Loss().to(device)

    # Optimizers
    optimizer_G = torch.optim.Adam(itertools.chain(G_AB.parameters(), G_BA.parameters()), lr=lr, betas=(0.5, 0.999))
    optimizer_D_A = torch.optim.Adam(D_A.parameters(), lr=lr, betas=(0.5, 0.999))
    optimizer_D_B = torch.optim.Adam(D_B.parameters(), lr=lr, betas=(0.5, 0.999))

    # Dataset Loader
    transform = transforms.Compose([
        transforms.Resize(int(img_size * 1.12), Image.BICUBIC),
        transforms.RandomCrop((img_size, img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
    ])
    
    dataloader = DataLoader(
        UnpairedDataset(dataset_path, transforms_=transform, unaligned=True),
        batch_size=batch_size,
        shuffle=True,
        num_workers=2,
    )

    lambda_cyc = 10.0
    lambda_id = 5.0

    print("Starting Training Loop...")
    for epoch in range(epochs):
        for i, batch in enumerate(dataloader):
            real_A = batch["A"].to(device)
            real_B = batch["B"].to(device)

            valid = torch.ones((real_A.size(0), 1, 16, 16), requires_grad=False).to(device)
            fake = torch.zeros((real_A.size(0), 1, 16, 16), requires_grad=False).to(device)

            # ------------------
            #  Train Generators
            # ------------------
            G_AB.train()
            G_BA.train()
            optimizer_G.zero_grad()

            loss_id_A = criterion_identity(G_BA(real_A), real_A)
            loss_id_B = criterion_identity(G_AB(real_B), real_B)
            loss_identity = (loss_id_A + loss_id_B) / 2

            fake_B = G_AB(real_A)
            loss_GAN_AB = criterion_GAN(D_B(fake_B), valid)
            fake_A = G_BA(real_B)
            loss_GAN_BA = criterion_GAN(D_A(fake_A), valid)
            loss_GAN = (loss_GAN_AB + loss_GAN_BA) / 2

            recov_A = G_BA(fake_B)
            loss_cycle_A = criterion_cycle(recov_A, real_A)
            recov_B = G_AB(fake_A)
            loss_cycle_B = criterion_cycle(recov_B, real_B)
            loss_cycle = (loss_cycle_A + loss_cycle_B) / 2

            loss_G = loss_GAN + lambda_cyc * loss_cycle + lambda_id * loss_identity
            loss_G.backward()
            optimizer_G.step()

            # -----------------------
            #  Train Discriminator A
            # -----------------------
            optimizer_D_A.zero_grad()
            loss_real = criterion_GAN(D_A(real_A), valid)
            loss_fake = criterion_GAN(D_A(fake_A.detach()), fake)
            loss_D_A = (loss_real + loss_fake) / 2
            loss_D_A.backward()
            optimizer_D_A.step()

            # -----------------------
            #  Train Discriminator B
            # -----------------------
            optimizer_D_B.zero_grad()
            loss_real = criterion_GAN(D_B(real_B), valid)
            loss_fake = criterion_GAN(D_B(fake_B.detach()), fake)
            loss_D_B = (loss_real + loss_fake) / 2
            loss_D_B.backward()
            optimizer_D_B.step()

            if i % 100 == 0:
                print(f"[Epoch {epoch}/{epochs}] [Batch {i}/{len(dataloader)}] [D loss: {(loss_D_A + loss_D_B).item():.4f}] [G loss: {loss_G.item():.4f}]")

        # Save model weights at end of epoch
        torch.save(G_AB, f"{checkpoint_dir}/latest_net_G.pth")
        torch.save(G_BA, f"{checkpoint_dir}/latest_net_G_BA.pth")
        print(f"Epoch {epoch} complete, latest_net_G.pth saved.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset_path", type=str, required=True, help="Path to kaggle dataset root")
    parser.add_argument("--epochs", type=int, default=200, help="number of epochs of training")
    parser.add_argument("--batch_size", type=int, default=1, help="size of the batches")
    args = parser.parse_args()

    train_cyclegan(args.dataset_path, args.epochs, args.batch_size)
