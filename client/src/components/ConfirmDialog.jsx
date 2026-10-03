import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({ open, title, message, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="mb-5 text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Confirm</Button>
      </div>
    </Modal>
  );
}
