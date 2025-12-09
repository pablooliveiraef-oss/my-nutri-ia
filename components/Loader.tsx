
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 my-8 p-6 bg-gray-800/50 rounded-2xl shadow-lg w-full max-w-md">
      <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-amber-300 text-lg font-medium">Analisando sua refeição...</p>
      <p className="text-gray-400 text-center text-sm">Consultando a Tabela Brasileira (TACO) <br/> e calculando valores nutricionais.</p>
    </div>
  );
};
