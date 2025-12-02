'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarType, Gender } from '@/lib/iztro-engine';

interface DatePickerProps {
    onGenerate: (data: any) => void;
}

export default function DatePicker({ onGenerate }: DatePickerProps) {
    const [name, setName] = useState('');
    const [gender, setGender] = useState<Gender>('male');
    const [calendarType, setCalendarType] = useState<CalendarType>('solar');
    const [dateStr, setDateStr] = useState('2000-01-01');
    const [timeIndex, setTimeIndex] = useState(0);

    const handleSubmit = () => {
        onGenerate({
            name,
            gender,
            type: calendarType,
            dateStr,
            timeIndex,
        });
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-black text-white border border-gray-800 rounded-lg shadow-2xl font-serif">
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl tracking-widest text-gray-200">MYSTIC LAB</h2>
                    <p className="text-xs text-gray-500 mt-2 tracking-widest">EXPLORE YOUR DESTINY</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 p-3 text-center text-white focus:outline-none focus:border-white transition-colors"
                        placeholder="Your Name"
                    />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500">Gender</label>
                    <div className="flex gap-4">
                        {(['male', 'female'] as const).map((g) => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className={`flex-1 p-3 border ${gender === g ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800'
                                    } transition-all duration-300 uppercase tracking-widest text-sm`}
                            >
                                {g === 'male' ? 'Male' : 'Female'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calendar Type */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500">Calendar</label>
                    <div className="flex gap-4">
                        {(['solar', 'lunar'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setCalendarType(t)}
                                className={`flex-1 p-3 border ${calendarType === t ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800'
                                    } transition-all duration-300 uppercase tracking-widest text-sm`}
                            >
                                {t === 'solar' ? 'Solar' : 'Lunar'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500">Date</label>
                    <input
                        type="date"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 p-3 text-center text-white focus:outline-none focus:border-white transition-colors"
                    />
                </div>

                {/* Time */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500">Time (Chinese Hour)</label>
                    <select
                        value={timeIndex}
                        onChange={(e) => setTimeIndex(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-800 p-3 text-center text-white focus:outline-none focus:border-white transition-colors appearance-none"
                    >
                        {Array.from({ length: 13 }).map((_, i) => (
                            <option key={i} value={i}>
                                {i === 0 ? 'Early Rat (00-01)' : i === 12 ? 'Late Rat (23-00)' : `${i} (${(i * 2 - 1).toString().padStart(2, '0')}:00-${(i * 2 + 1).toString().padStart(2, '0')}:00)`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Submit */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    className="w-full mt-8 bg-white text-black p-4 uppercase tracking-[0.2em] text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                    Open Astrolabe
                </motion.button>
            </div>
        </div>
    );
}
