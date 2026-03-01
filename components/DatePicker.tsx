import React from 'react';
import { formatToYyyyMmDd } from '../utils/date';

interface DatePickerProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    onPrev: () => void;
    onNext: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateChange, onPrev, onNext }) => {
    
    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date(event.target.value + 'T00:00:00');
        onDateChange(date);
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200 md:flex-nowrap">
            <button onClick={onPrev} className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600">
                &lt; Anterior
            </button>
            <input 
                type="date"
                value={formatToYyyyMmDd(selectedDate)}
                onChange={handleDateChange}
                className="text-base font-semibold text-gray-700 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
            />
            <button onClick={onNext} className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600">
                Próximo &gt;
            </button>
        </div>
    );
};

export default DatePicker;