export interface ImageLayer {
  id: string;
  type: 'original' | 'removed-bg';
  imageUrl: string;
  name: string;
  isVisible: boolean;
  opacity: number;
  parentId?: string;
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  position: {
    x: number;
    y: number;
  };
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
    aspect?: number;
  };
  originalDimensions?: {
    width: number;
    height: number;
  };
}

export interface TextSet {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: {
    x: number;
    y: number;
  };
  fontWeight: number;
} 