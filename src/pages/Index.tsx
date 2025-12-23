import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  actual: PredictionValue;
  predicted: PredictionValue;
  isCorrect: boolean;
}

const generateRandomValue = (): PredictionValue => {
  return Math.random() < 0.5 ? 'Альфа' : 'Омега';
};

const analyzePatternsAndPredict = (history: PredictionRecord[]): PredictionValue => {
  if (history.length === 0) return generateRandomValue();

  const alphaCount = history.filter(r => r.actual === 'Альфа').length;
  const omegaCount = history.length - alphaCount;
  
  if (history.length < 3) {
    return alphaCount > omegaCount ? 'Альфа' : 'Омега';
  }

  const recent = history.slice(-10).map(r => r.actual);
  
  const sequenceScore = { 'Альфа': 0, 'Омега': 0 };
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] === recent[i - 1]) {
      sequenceScore[recent[i]]++;
    }
  }

  const last = recent[recent.length - 1];
  const beforeLast = recent[recent.length - 2];
  
  if (last === beforeLast) {
    return last === 'Альфа' ? 'Альфа' : 'Омега';
  }

  const frequencyWeight = alphaCount > omegaCount ? 'Альфа' : 'Омега';
  const sequenceWeight = sequenceScore['Альфа'] > sequenceScore['Омега'] ? 'Альфа' : 'Омега';
  
  return frequencyWeight === sequenceWeight ? frequencyWeight : last === 'Альфа' ? 'Омега' : 'Альфа';
};

const Index = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [nextPrediction, setNextPrediction] = useState<PredictionValue>('Альфа');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const actualValue = generateRandomValue();
          const predictedValue = nextPrediction;
          
          const newRecord: PredictionRecord = {
            id: Date.now().toString(),
            timestamp: new Date(),
            actual: actualValue,
            predicted: predictedValue,
            isCorrect: actualValue === predictedValue,
          };

          setHistory((prev) => {
            const updated = [...prev, newRecord];
            const newPrediction = analyzePatternsAndPredict(updated);
            setNextPrediction(newPrediction);
            return updated;
          });

          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, nextPrediction]);

  const handleStart = () => {
    setIsRunning(true);
    if (history.length === 0) {
      setNextPrediction(generateRandomValue());
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHistory([]);
    setNextPrediction('Альфа');
    setCountdown(30);
  };

  const correctCount = history.filter(r => r.isCorrect).length;
  const totalCount = history.length;
  const accuracy = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : '0.0';

  const chartData = {
    labels: history.slice(-20).map((_, i) => i + 1),
    datasets: [
      {
        label: 'Альфа',
        data: history.slice(-20).map(r => r.actual === 'Альфа' ? 1 : 0),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Омега',
        data: history.slice(-20).map(r => r.actual === 'Омега' ? 1 : 0),
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
          <p className="text-muted-foreground">Интеллектуальный анализ паттернов в режиме реального времени</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="TrendingUp" size={20} className="text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground">Точность прогноза</h3>
            </div>
            <p className="text-4xl font-bold text-foreground">{accuracy}%</p>
            <p className="text-sm text-muted-foreground">{correctCount} из {totalCount}</p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="Clock" size={20} className="text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground">До следующего</h3>
            </div>
            <p className={`text-4xl font-bold ${isRunning ? 'text-primary animate-pulse-soft' : 'text-muted-foreground'}`}>
              {countdown}с
            </p>
            <p className="text-sm text-muted-foreground">Обновление каждые 30 секунд</p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="Lightbulb" size={20} className="text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground">Следующий прогноз</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={nextPrediction === 'Альфа' ? 'default' : 'secondary'}
                className={`text-2xl font-bold px-4 py-2 ${
                  nextPrediction === 'Альфа' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {nextPrediction}
              </Badge>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Icon name="Activity" size={24} />
              Панель управления
            </h2>
            <div className="flex gap-2">
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
        </Card>

        {history.length > 0 && (
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
            История прогнозов
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Время</TableHead>
                  <TableHead>Результат</TableHead>
                  <TableHead>Прогноз</TableHead>
                  <TableHead className="text-right">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Нажмите "Старт" для начала работы системы
                    </TableCell>
                  </TableRow>
                ) : (
                  [...history].reverse().map((record) => (
                    <TableRow key={record.id} className="animate-slide-in">
                      <TableCell className="font-mono text-sm">
                        {record.timestamp.toLocaleTimeString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={record.actual === 'Альфа' ? 'default' : 'secondary'}
                          className={record.actual === 'Альфа' 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-purple-500 hover:bg-purple-600'
                          }
                        >
                          {record.actual}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={record.predicted === 'Альфа' 
                            ? 'border-green-500 text-green-700' 
                            : 'border-purple-500 text-purple-700'
                          }
                        >
                          {record.predicted}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.isCorrect ? (
                          <Badge variant="default" className="bg-primary gap-1">
                            <Icon name="Check" size={14} />
                            Правда
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <Icon name="X" size={14} />
                            Ложь
                          </Badge>
                        )}
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
