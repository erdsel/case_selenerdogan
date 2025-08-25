import React from 'react';
import './ErrorModal.css';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div className="error-modal" onClick={(e) => e.stopPropagation()}>
        <div className="error-modal-header">
          <h3 className="error-modal-title">{title}</h3>
          <button className="error-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="error-modal-body">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            {message.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
        <div className="error-modal-footer">
          <button className="error-modal-button" onClick={onClose}>
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};