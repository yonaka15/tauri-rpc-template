import React from 'react';

// 確認ダイアログのプロパティ型定義
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// 確認ダイアログコンポーネント
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* 背景のオーバーレイ */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onCancel}></div>
      
      {/* ダイアログボックス */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={onConfirm}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
