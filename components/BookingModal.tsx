
import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/date';
import type { Room, Period } from '../types';
import Modal from './Modal';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, notes: string) => void;
    room: Room | undefined;
    period: Period | undefined;
    date: Date;
    isLoading: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSubmit, room, period, date, isLoading }) => {
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen || !room || !period) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(title.trim()) {
            onSubmit(title, notes);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Reserva">
             <div className="mb-6 space-y-2 text-gray-600">
                <p><span className="font-semibold">Sala:</span> {room.name}</p>
                <p><span className="font-semibold">Data:</span> {formatDate(date)}</p>
                {/* Fixed incorrect property names start_time and end_time to startTime and endTime */}
                <p><span className="font-semibold">Período:</span> {period.label} ({period.startTime} - {period.endTime})</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título da Reserva</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                        autoFocus
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !title.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[160px]"
                    >
                         {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Confirmar Reserva'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default BookingModal;