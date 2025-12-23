import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type PredictionValue = 'Альфа' | 'Омега';

interface PredictionRecord {
  id: string;
  timestamp: Date;
  actual: PredictionValue | null;
  predictions: {
    step1: PredictionValue;
    step2: PredictionValue;
    step3: PredictionValue;
  };
  results: {
    step1: boolean | null;
    step2: boolean | null;
    step3: boolean | null;
  };
}

const analyzePatternsAndPredict = (history: PredictionValue[], steps: number = 3): PredictionValue[] => {
  if (history.length === 0) return Array(steps).fill('Альфа');

  const predictions: PredictionValue[] = [];
  const workingHistory = [...history];

  for (let step = 0; step < steps; step++) {
    const alphaCount = workingHistory.filter(v => v === 'Альфа').length;
    const omegaCount = workingHistory.length - alphaCount;

    if (workingHistory.length < 3) {
      const predicted = alphaCount >= omegaCount ? 'Альфа' : 'Омега';
      predictions.push(predicted);
      workingHistory.push(predicted);
      continue;
    }

    const recent = workingHistory.slice(-10);
    
    const pairPatterns: Record<string, { alpha: number; omega: number }> = {};
    for (let i = 0; i < recent.length - 1; i++) {
      const pair = recent[i];
      const next = recent[i + 1];
      if (!pairPatterns[pair]) {
        pairPatterns[pair] = { alpha: 0, omega: 0 };
      }
      if (next === 'Альфа') {
        pairPatterns[pair].alpha++;
      } else {
        pairPatterns[pair].omega++;
      }
    }

    const lastValue = recent[recent.length - 1];
    let predicted: PredictionValue;

    if (pairPatterns[lastValue]) {
      const pattern = pairPatterns[lastValue];
      predicted = pattern.alpha >= pattern.omega ? 'Альфа' : 'Омега';
    } else {
      predicted = alphaCount >= omegaCount ? 'Альфа' : 'Омега';
    }

    predictions.push(predicted);
    workingHistory.push(predicted);
  }

  return predictions;
};

const Index = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [sourceData, setSourceData] = useState<PredictionValue[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [interval, setIntervalDuration] = useState(30);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return interval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, interval]);

  const handleManualInput = (value: PredictionValue) => {
    const predictions3Steps = analyzePatternsAndPredict(sourceData, 3);
    
    const newRecord: PredictionRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      actual: value,
      predictions: {
        step1: predictions3Steps[0],
        step2: predictions3Steps[1],
        step3: predictions3Steps[2],
      },
      results: {
        step1: null,
        step2: null,
        step3: null,
      },
    };

    setSourceData(prev => [...prev, value]);
    setHistory(prev => {
      const updated = [...prev, newRecord];
      
      if (updated.length >= 1 && updated[updated.length - 1].results.step1 === null) {
        updated[updated.length - 1].results.step1 = 
          updated[updated.length - 1].predictions.step1 === value;
      }
      
      if (updated.length >= 2 && updated[updated.length - 2].results.step2 === null) {
        updated[updated.length - 2].results.step2 = 
          updated[updated.length - 2].predictions.step2 === value;
      }
      
      if (updated.length >= 3 && updated[updated.length - 3].results.step3 === null) {
        updated[updated.length - 3].results.step3 = 
          updated[updated.length - 3].predictions.step3 === value;
      }

      return updated;
    });

    setCurrentInput('');
    setCountdown(interval);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = e.key.toLowerCase();
    if (value === 'a' || value === 'а') {
      e.preventDefault();
      handleManualInput('Альфа');
    } else if (value === 'o' || value === 'о') {
      e.preventDefault();
      handleManualInput('Омега');
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHistory([]);
    setSourceData([]);
    setCurrentInput('');
    setCountdown(interval);
  };

  const totalPredictions = history.reduce((acc, record) => {
    return acc + (record.results.step1 !== null ? 1 : 0) + 
           (record.results.step2 !== null ? 1 : 0) + 
           (record.results.step3 !== null ? 1 : 0);
  }, 0);

  const correctPredictions = history.reduce((acc, record) => {
    return acc + (record.results.step1 === true ? 1 : 0) + 
           (record.results.step2 === true ? 1 : 0) + 
           (record.results.step3 === true ? 1 : 0);
  }, 0);

  const accuracy = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : '0.0';

  const nextPredictions = history.length > 0 
    ? history[history.length - 1].predictions 
    : { step1: 'Альфа', step2: 'Альфа', step3: 'Альфа' };

  const chartData = {
    labels: sourceData.slice(-20).map((_, i) => i + 1),
    datasets: [
      {
        label: 'Альфа',
        data: sourceData.slice(-20).map(v => v === 'Альфа' ? 1 : 0),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Омега',
        data: sourceData.slice(-20).map(v => v === 'Омега' ? 1 : 0),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-foreground">Система прогнозирования Альфа/Омега</h1>
          <p className="text-muted-foreground">Анализ паттернов с прогнозом на 3 шага вперёд</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="TrendingUp" size={20} className="text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground">Точность прогноза</h3>
            </div>
            <p className="text-4xl font-bold text-foreground">{accuracy}%</p>
            <p className="text-sm text-muted-foreground">{correctPredictions} из {totalPredictions}</p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="Database" size={20} className="text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground">Данные собрано</h3>
            </div>
            <p className="text-4xl font-bold text-foreground">{sourceData.length}</p>
            <p className="text-sm text-muted-foreground">Записей в истории</p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="Clock" size={20} className="text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground">До обновления</h3>
            </div>
            <p className={`text-4xl font-bold ${isRunning ? 'text-primary animate-pulse-soft' : 'text-muted-foreground'}`}>
              {countdown}с
            </p>
            <p className="text-sm text-muted-foreground">Интервал: {interval} секунд</p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="Lightbulb" size={20} className="text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground">Прогнозы (1-3 шага)</h3>
            </div>
            <div className="flex gap-1 flex-wrap">
              {[nextPredictions.step1, nextPredictions.step2, nextPredictions.step3].map((pred, idx) => (
                <Badge 
                  key={idx}
                  variant={pred === 'Альфа' ? 'default' : 'secondary'}
                  className={`text-xs font-bold px-2 py-1 ${
                    pred === 'Альфа' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  {idx + 1}: {pred}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Icon name="Activity" size={24} />
              Панель управления
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="interval">Интервал (сек):</Label>
                <Input
                  id="interval"
                  type="number"
                  min="5"
                  max="120"
                  value={interval}
                  onChange={(e) => setIntervalDuration(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-20"
                />
              </div>
              <Button 
                onClick={handleStart} 
                disabled={isRunning}
                className="gap-2"
              >
                <Icon name="Play" size={16} />
                Старт
              </Button>
              <Button 
                onClick={handleStop} 
                disabled={!isRunning}
                variant="outline"
                className="gap-2"
              >
                <Icon name="Pause" size={16} />
                Стоп
              </Button>
              <Button 
                onClick={handleReset}
                variant="destructive"
                className="gap-2"
              >
                <Icon name="RotateCcw" size={16} />
                Сброс
              </Button>
            </div>
          </div>

          {isRunning && (
            <div className="border-t pt-4 mt-4">
              <Label htmlFor="data-input" className="text-base font-semibold mb-2 block">
                Ввод данных (A - Альфа, O - Омега)
              </Label>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  id="data-input"
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Нажмите A или O для ввода..."
                  className="flex-1"
                  autoFocus
                />
                <Button 
                  onClick={() => handleManualInput('Альфа')}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Альфа
                </Button>
                <Button 
                  onClick={() => handleManualInput('Омега')}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Омега
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Система работает в фоновом режиме. Вводите значения по мере появления.
              </p>
            </div>
          )}
        </Card>

        {sourceData.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="BarChart3" size={24} />
              График последовательности
            </h2>
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Icon name="Table" size={24} />
            История с прогнозами на 3 шага
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Время</TableHead>
                  <TableHead>Результат</TableHead>
                  <TableHead>Шаг +1</TableHead>
                  <TableHead>Шаг +2</TableHead>
                  <TableHead>Шаг +3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Нажмите "Старт" и начните вводить данные
                    </TableCell>
                  </TableRow>
                ) : (
                  [...history].reverse().map((record) => (
                    <TableRow key={record.id} className="animate-slide-in">
                      <TableCell className="font-mono text-sm">
                        {record.timestamp.toLocaleTimeString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        {record.actual && (
                          <Badge 
                            variant={record.actual === 'Альфа' ? 'default' : 'secondary'}
                            className={record.actual === 'Альфа' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-purple-500 hover:bg-purple-600'
                            }
                          >
                            {record.actual}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-primary text-primary">
                            {record.predictions.step1}
                          </Badge>
                          {record.results.step1 !== null && (
                            record.results.step1 ? (
                              <Icon name="Check" size={16} className="text-green-500" />
                            ) : (
                              <Icon name="X" size={16} className="text-red-500" />
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-primary text-primary">
                            {record.predictions.step2}
                          </Badge>
                          {record.results.step2 !== null && (
                            record.results.step2 ? (
                              <Icon name="Check" size={16} className="text-green-500" />
                            ) : (
                              <Icon name="X" size={16} className="text-red-500" />
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-primary text-primary">
                            {record.predictions.step3}
                          </Badge>
                          {record.results.step3 !== null && (
                            record.results.step3 ? (
                              <Icon name="Check" size={16} className="text-green-500" />
                            ) : (
                              <Icon name="X" size={16} className="text-red-500" />
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
