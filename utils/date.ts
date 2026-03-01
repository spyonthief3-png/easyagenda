/**
 * Adiciona um número de dias a uma data.
 * @param date A data inicial.
 * @param days O número de dias a adicionar (pode ser negativo).
 * @returns A nova data.
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Adiciona um número de meses a uma data.
 * @param date A data inicial.
 * @param months O número de meses a adicionar.
 * @returns A nova data.
 */
export const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};


/**
 * Subtrai um número de dias de uma data.
 * @param date A data inicial.
 * @param days O número de dias a subtrair.
 * @returns A nova data.
 */
export const subDays = (date: Date, days: number): Date => addDays(date, -days);

/**
 * Formata uma data para o padrão brasileiro (dd/MM/yyyy).
 * @param date O objeto Date a ser formatado.
 * @returns A data formatada como string.
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formata uma data para o padrão YYYY-MM-DD.
 * Este método é seguro para fuso horário, pois não converte para UTC.
 * @param date O objeto Date a ser formatado.
 * @returns A data formatada como string.
 */
export const formatToYyyyMmDd = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Retorna todos os dias da semana para uma data específica.
 * @param date A data de referência.
 * @returns Um array de objetos Date, de Domingo a Sábado.
 */
export const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = subDays(date, date.getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
};

/**
 * Retorna todos os dias para renderizar em uma grade de calendário mensal.
 * Inclui dias do mês anterior e posterior para preencher a grade.
 * @param date A data de referência (qualquer dia do mês desejado).
 * @returns Um array de objetos Date.
 */
export const getMonthGridDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days: Date[] = [];
    const startDate = subDays(firstDayOfMonth, firstDayOfMonth.getDay());
    const endDate = addDays(lastDayOfMonth, 6 - lastDayOfMonth.getDay());

    let currentDate = startDate;
    while (currentDate <= endDate) {
        days.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
    }
    return days;
};