'use client';

import { useState, useEffect } from 'react';

interface AuctionTimerProps {
  endTime: string;
  extendedUntil?: string;
  status: string;
  extensionCount: number;
  onTimeExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function AuctionTimer({ 
  endTime, 
  extendedUntil, 
  status, 
  extensionCount,
  onTimeExpired 
}: AuctionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const targetTime = new Date(extendedUntil || endTime).getTime();
      const currentTime = new Date().getTime();
      const difference = targetTime - currentTime;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        });
        
        if (!isExpired && ['active', 'extended'].includes(status)) {
          setIsExpired(true);
          onTimeExpired?.();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
      });

      setIsExpired(false);
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [endTime, extendedUntil, status, isExpired, onTimeExpired]);

  const getUrgencyLevel = () => {
    const totalMinutes = Math.floor(timeRemaining.total / (1000 * 60));
    if (totalMinutes <= 3) return 'critical';
    if (totalMinutes <= 10) return 'warning';
    if (totalMinutes <= 30) return 'caution';
    return 'normal';
  };

  const getTimerColor = () => {
    const urgency = getUrgencyLevel();
    switch (urgency) {
      case 'critical':
        return 'text-red-600 animate-pulse';
      case 'warning':
        return 'text-orange-600';
      case 'caution':
        return 'text-yellow-600';
      default:
        return 'text-gray-900';
    }
  };

  const getBackgroundColor = () => {
    const urgency = getUrgencyLevel();
    switch (urgency) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'caution':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const isActive = ['active', 'extended'].includes(status);

  if (!isActive) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">
            {status === 'ended' ? '🏁' : status === 'draft' ? '⏳' : '❌'}
          </div>
          <div className="text-gray-600">
            {status === 'ended' ? '拍賣已結束' :
             status === 'draft' ? '拍賣尚未開始' : '拍賣已取消'}
          </div>
        </div>
      </div>
    );
  }

  if (isExpired || timeRemaining.total <= 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">🏁</div>
          <div className="text-gray-600">拍賣時間已結束</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${getBackgroundColor()}`}>
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">
          {status === 'extended' ? '延長倒計時' : '拍賣倒計時'}
        </div>
        
        {extensionCount > 0 && (
          <div className="text-xs text-yellow-600 mb-2">
            已延長 {extensionCount} 次
          </div>
        )}
        
        <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
          {timeRemaining.days > 0 && (
            <>
              <span className="inline-block mx-1">
                {formatTime(timeRemaining.days)}
                <span className="text-sm ml-1">天</span>
              </span>
            </>
          )}
          <span className="inline-block mx-1">
            {formatTime(timeRemaining.hours)}
            <span className="text-sm ml-1">時</span>
          </span>
          <span className="inline-block mx-1">
            {formatTime(timeRemaining.minutes)}
            <span className="text-sm ml-1">分</span>
          </span>
          <span className="inline-block mx-1">
            {formatTime(timeRemaining.seconds)}
            <span className="text-sm ml-1">秒</span>
          </span>
        </div>
        
        {extendedUntil && (
          <div className="text-xs text-gray-600 mt-2">
            延長至: {new Date(extendedUntil).toLocaleString('zh-TW')}
          </div>
        )}
        
        {getUrgencyLevel() === 'critical' && (
          <div className="text-xs text-red-600 mt-2 animate-pulse">
            ⚠️ 軟關閉時間！每次出價將延長拍賣時間
          </div>
        )}
        
        {getUrgencyLevel() === 'warning' && (
          <div className="text-xs text-orange-600 mt-2">
            ⏰ 即將進入軟關閉時間
          </div>
        )}
      </div>
    </div>
  );
}