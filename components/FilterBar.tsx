
import React, { useState, useEffect } from 'react';
import type { Location, RoomType } from '../types';

export interface Filters {
    search: string;
    locationId: string;
    roomTypeId: string;
}

interface FilterBarProps {
    locations: Location[];
    roomTypes: RoomType[];
    onFilterChange: (filters: Filters) => void;
    initialFilters?: Partial<Filters>;
    showSearch?: boolean;
    showLocation?: boolean;
    showRoomType?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
    locations,
    roomTypes,
    onFilterChange,
    initialFilters = {},
    showSearch = false,
    showLocation = false,
    showRoomType = false
}) => {
    const [filters, setFilters] = useState<Filters>({
        search: initialFilters.search || '',
        locationId: initialFilters.locationId || '',
        roomTypeId: initialFilters.roomTypeId || '',
    });

    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClear = () => {
        setFilters({ search: '', locationId: '', roomTypeId: '' });
    };

    const hasActiveFilters = !!(filters.search || filters.locationId || filters.roomTypeId);

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:items-end">
                {showSearch && (
                    <div className="lg:col-span-2">
                        <label htmlFor="search" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Buscar por nome</label>
                        <input
                            type="text"
                            id="search"
                            name="search"
                            value={filters.search}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                            placeholder="Digite o nome da sala..."
                        />
                    </div>
                )}
                {showLocation && (
                     <div>
                        <label htmlFor="locationId" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Localização</label>
                        <select id="locationId" name="locationId" value={filters.locationId} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm appearance-none">
                            <option value="">Todas</option>
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>
                )}
                 {showRoomType && (
                     <div>
                        <label htmlFor="roomTypeId" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo de Sala</label>
                        <select id="roomTypeId" name="roomTypeId" value={filters.roomTypeId} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm appearance-none">
                            <option value="">Todos</option>
                            {roomTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                        </select>
                    </div>
                )}
                 {(showLocation || showRoomType || showSearch) && (
                     <div className="flex items-end">
                        <button 
                            onClick={handleClear} 
                            disabled={!hasActiveFilters} 
                            className="w-full bg-gray-100 text-gray-600 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default FilterBar;
