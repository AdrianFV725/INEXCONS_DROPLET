import React from 'react';
import '../styles/WeekView.css';

const WeekList = ({ year, weeks, onDeleteYear }) => {
    return (
        <div className="weeks-container">
            <select className="year-selector" value={year} onChange={(e) => onYearChange(e.target.value)}>
                <option value={year}>{year}</option>
            </select>

            <button className="delete-year-button" onClick={() => onDeleteYear(year)}>
                <i className="fas fa-trash"></i>
                Eliminar año {year}
            </button>

            <div className="week-table">
                {/* Header solo visible en desktop */}
                <div className="week-header">
                    <div>Semana</div>
                    <div>Período</div>
                    <div>Estado</div>
                </div>

                {/* Filas de semanas */}
                {weeks.map((week) => (
                    <div key={week.number} className="week-row">
                        <div className="week-cell" data-label="Semana">
                            <div className="week-number">
                                Semana {week.number}
                                {week.isCurrentWeek && (
                                    <span className="week-badge">Actual</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="week-cell" data-label="Período">
                            <div className="week-dates">
                                {week.startDate} - {week.endDate}
                            </div>
                        </div>
                        
                        <div className="week-cell" data-label="Estado">
                            <div className="week-status">
                                {/* Aquí puedes agregar iconos o indicadores de estado */}
                                <i className="fas fa-check-circle"></i>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeekList; 