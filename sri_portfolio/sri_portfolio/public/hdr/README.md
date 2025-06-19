# HDRI Environment Setup

This folder is for High Dynamic Range Image (HDRI) files that enhance the 3D environment with realistic lighting and reflections.

## Adding HDRI Files

1. **Supported Formats**: `.hdr` files (RGBE format)
2. **Expected Filename**: `space_environment.hdr`
3. **Recommended Resolution**: 2K-4K for good quality without performance impact

## Where to Find HDRI Files

- **Free Sources**:
  - [Poly Haven](https://polyhaven.com/hdris) (CC0 license)
  - [HDRI Haven](https://hdrihaven.com/) (CC0 license)
  
- **Recommended Space/Galaxy HDRIs**:
  - Space nebula environments
  - Star field backgrounds
  - Galaxy textures

## Usage

Simply place your `.hdr` file in this folder and rename it to `space_environment.hdr`. The system will automatically:

1. Load the HDRI during initialization
2. Apply it as both environment lighting and background
3. Fallback to a procedural star environment if no HDRI is found

## Performance Notes

- Larger HDRI files (8K+) may impact loading performance
- 2K-4K files provide the best balance of quality and performance
- The system includes automatic fallback for graceful degradation

## Current Status

Currently using procedural star environment. Add `space_environment.hdr` to enable HDRI lighting. 