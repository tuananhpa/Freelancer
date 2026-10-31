import { getApiErrorMessage } from '../../services/api';
import React, { useState } from 'react';
import classService from '../../services/class.service';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

import Portal from '../../components/ui/Portal';
interface JoinClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const JoinClassModal: React.FC<JoinClassModalProps> = ({ onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Vui lòng nhập mã lớp');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await classService.joinClass(inviteCode.trim().toUpperCase());
      onSuccess();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể tham gia lớp học. Vui lòng kiểm tra lại mã.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal><div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full card p-0">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-4" id="modal-title">
                  Tham gia lớp học
                </h3>
                
                {error && (
                  <Alert variant="error" className="mb-4">
                    {error}
                  </Alert>
                )}

                <div className="bg-camNhat rounded-xl p-4 mb-6 border border-cam">
                  <p className="text-sm text-camDam font-medium">
                    Hỏi giáo viên của bạn để lấy mã lớp, sau đó nhập vào đây.
                  </p>
                  <p className="text-xs text-camDam opacity-80 mt-2">
                    Mã lớp bao gồm 6 ký tự (chữ cái và số).
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Mã lớp
                    </label>
                    <input
                      type="text"
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cam outline-none transition-colors uppercase tracking-widest text-center text-xl font-mono"
                      placeholder="VD: A1B2C3"
                      maxLength={6}
                      autoComplete="off"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end border-t border-gray-100 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={inviteCode.length < 6}
              isLoading={loading}
              className="w-full sm:w-auto"
            >
              Tham gia
            </Button>
          </div>
        </div>
      </div>
    </div></Portal>
  );
};

export default JoinClassModal;
