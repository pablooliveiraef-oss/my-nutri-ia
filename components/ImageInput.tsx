
import React, { useRef } from 'react';
import { CameraIcon, UploadIcon } from './icons';

interface ImageInputProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelected(event.target.files[0]);
    }
  };

  const baseButtonClasses = "flex-1 flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-amber-500/50";
  const enabledClasses = "bg-amber-400 text-gray-900 hover:bg-amber-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1";
  const disabledClasses = "bg-gray-600 text-gray-400 cursor-not-allowed";
  
  return (
    <div className="w-full max-w-2xl p-2 bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
        <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
        />
        <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
        />
        <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isLoading}
            className={`${baseButtonClasses} ${isLoading ? disabledClasses : enabledClasses}`}
        >
            <CameraIcon className="w-7 h-7" />
            <span>Tirar Foto</span>
        </button>
        <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`${baseButtonClasses} ${isLoading ? disabledClasses : enabledClasses}`}
        >
            <UploadIcon className="w-7 h-7" />
            <span>Carregar Imagem</span>
        </button>
        </div>
    </div>
  );
};
