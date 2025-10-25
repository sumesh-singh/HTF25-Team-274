import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const matches = [
    {
        name: 'Sarah Lee',
        skill: 'Teaches: UI/UX Design',
        match: '95%',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL_zTxmian6WXvHrl1HUklorQo7Me5wbC2GHjBYQnPdBqa2D1zBiL5eFFGXLYXdKoYb3CBGATwAzeXwNwh8zj1MJr1xNzCYy9vQJmg89dnKD6qHkW8n7rWyJIRQB_5gGy2FaldUPdKiO1mvE4qLH8lXuPz4NVqvUHWb9PFmdII1Rnr26taX9Pda1bsvFAIGutPykdytCwHM46vKwerkmt22ym9Pb-PcBq53RPRMalovLLl4r6Elfnb1FVAl6XqXmwfnZuxAyR27wdf',
        online: true,
    },
    {
        name: 'Mark Chen',
        skill: 'Wants to learn: Python',
        match: '92%',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeN0peK2wSAYAkNMoDK7iLA5jbMcFyTewlpPRMIo5PyTLYvyrRmnxjj0RdBHoZMwof4Dyf7TKSIfOXYlIvuiAMq9m2wXL5RaZBANR7ZUtuny2jlyfWUMe0X5JKLXn-SxMppoJfllCckJ5XL84h-c1enAG9NHi01tj_jJG-iIkjlapvHDijpwbVzEM3kFxwQcYaeimI7LrP3lg2cntHNRXH6F1-Tv2WP5GVLTeWeV77Z2yclE1IJkkFS3ZtOQe1lpaQ93Gl2tBYb76O',
        online: false,
    },
    {
        name: 'Emily Carter',
        skill: 'Teaches: Guitar Basics',
        match: '88%',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmGS7R68_ZBocrjVQIR2W-ScnS4WTJra9nobhdnaZvC5ZlBVNpekTsKgH1Cqs36aaLtY8nJrp0N_YHEZFXN2EfFiClI72Oyb5xy58IsZJ7kdmmBfnR9Uk7fLrKqaUB_MASuzRAgpGfS8HHS_cywi_4JSs3-b2YVvnbmtD5OB8V3gF4_wr9NPmurfY68uqy_nkDnEqIDjhIuHyNvgylUx_xZb_iH4bPHQdiRIaEf-OpcTSfz0JS8z1bm1jpMUNnnkvhGVdJH2COsAjm',
        online: true,
    },
];

const TopMatches = () => {
  return (
    <div className="flex flex-col gap-2">
      {matches.map((match, index) => (
        <div key={index} className="group flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-all duration-300 hover:bg-background-light hover:shadow-lg dark:hover:bg-background-dark">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${match.avatar})` }}></div>
            {match.online && (
                <div className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-card-dark">
                    <div className="h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-card-dark"></div>
                </div>
            )}
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">{match.name}</p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{match.skill}</p>
          </div>
          <div className="text-center transition-transform duration-300 group-hover:scale-110">
            <p className="text-lg font-bold text-secondary">{match.match}</p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Match</p>
          </div>
          <div className="flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button className="h-9 min-w-0 rounded-full bg-background-light px-4 text-sm font-semibold leading-normal text-text-light-primary transition-colors hover:bg-gray-200 dark:bg-background-dark dark:text-text-dark-primary dark:hover:bg-gray-700">View</button>
            <button className="h-9 min-w-0 rounded-full bg-primary px-4 text-sm font-semibold leading-normal text-white transition-colors hover:bg-primary-light">Request</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopMatches;
