/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamStatsCards.jsx
 * Description: Component các thẻ thống kê tổng quan trạng thái tài khoản
 */

import React from 'react';
import { Users, CheckCircle2, XCircle, AlertTriangle, PlayCircle } from 'lucide-react';

export default function ZTTeamStatsCards({ ztteamStats, ztteamActiveFilter, ztteamOnSelectFilter }) {
  const ztteamCards = [
    {
      id: '',
      title: 'Tổng tài khoản',
      count: ztteamStats.total || 0,
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30'
    },
    {
      id: 'Live',
      title: 'Tài khoản Live',
      count: ztteamStats.live || 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      id: 'Die',
      title: 'Tài khoản Die',
      count: ztteamStats.die || 0,
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30'
    },
    {
      id: 'Checkpoint',
      title: 'Dính Checkpoint',
      count: ztteamStats.checkpoint || 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    },
    {
      id: 'Đang chạy',
      title: 'Đang mở / Chạy',
      count: ztteamStats.running || 0,
      icon: PlayCircle,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {ztteamCards.map((ztteamCard) => {
        const IconComponent = ztteamCard.icon;
        const ztteamIsActive = ztteamActiveFilter === ztteamCard.id;

        return (
          <button
            key={ztteamCard.title}
            onClick={() => ztteamOnSelectFilter(ztteamCard.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
              ztteamIsActive
                ? `${ztteamCard.borderColor} ${ztteamCard.bgColor} ring-2 ring-indigo-500/40 shadow-lg`
                : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{ztteamCard.title}</span>
              <div className={`p-1.5 rounded-lg ${ztteamCard.bgColor}`}>
                <IconComponent className={`w-4 h-4 ${ztteamCard.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {ztteamCard.count.toLocaleString()}
            </div>
          </button>
        );
      })}
    </div>
  );
}
