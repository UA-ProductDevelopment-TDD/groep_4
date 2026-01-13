import { useState, useEffect } from 'react';
import { TodoForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';
import { Bell, CheckCircle2 } from 'lucide-react';
import { Button } from './components/ui/button';
import { toast, Toaster } from 'sonner';

export interface Todo {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  completed: boolean;
  notifiedStart: boolean;
  notifiedEnd: boolean;
  notifiedOverdue: boolean;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos);
      // Convert date strings back to Date objects
      const todosWithDates = parsedTodos.map((todo: any) => ({
        ...todo,
        startTime: new Date(todo.startTime),
        endTime: new Date(todo.endTime),
      }));
      setTodos(todosWithDates);
    }

    // Automatically request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            setNotificationsEnabled(true);
          }
        });
      }
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Check for notifications every minute
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkNotifications = () => {
      const now = new Date();
      
      setTodos((prevTodos: any[]) => {
        return prevTodos.map((todo: any) => {
          if (todo.completed) return todo;

          const timeToStart = new Date(todo.startTime).getTime() - now.getTime();
          const timeToEnd = new Date(todo.endTime).getTime() - now.getTime();
          const isOverdue = now.getTime() > new Date(todo.endTime).getTime();

          const updatedTodo = { ...todo };

          // Notify 15 min before start
          if (!todo.notifiedStart && timeToStart > 0 && timeToStart <= 15 * 60 * 1000) {
            // Play notification sound
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Ascending tone for start notification
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            
            new Notification('Task Starting Soon! ⏰', {
              body: `It's time to start your task "${todo.title}" in 15 minutes`,
              icon: '/favicon.ico',
            });
            
            toast.info('⏰ Task starting soon!', {
              description: `"${todo.title}" starts in 15 minutes`,
            });
            
            updatedTodo.notifiedStart = true;
          }

          // Notify 15 min before end
          if (!todo.notifiedEnd && timeToEnd > 0 && timeToEnd <= 15 * 60 * 1000) {
            // Play notification sound
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Double beep for ending notification
            oscillator.frequency.value = 700;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            
            new Notification('Task Ending Soon! ⏱️', {
              body: `"${todo.title}" ends in 15 minutes`,
              icon: '/favicon.ico',
            });
            
            toast.warning('⏱️ Task ending soon!', {
              description: `"${todo.title}" ends in 15 minutes`,
            });
            
            updatedTodo.notifiedEnd = true;
          }

          // Notify if overdue
          if (!todo.notifiedOverdue && isOverdue) {
            // Play alert sound
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Descending urgent tone for overdue
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            new Notification('Task Overdue! ⚠️', {
              body: `"${todo.title}" was not completed in time`,
              icon: '/favicon.ico',
            });
            
            toast.error('⚠️ Task overdue!', {
              description: `"${todo.title}" was not completed in time`,
            });
            
            updatedTodo.notifiedOverdue = true;
          }

          return updatedTodo;
        });
      });
    };

    const interval = setInterval(checkNotifications, 10000); // Check every 10 seconds
    checkNotifications(); // Check immediately

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const addTodo = (title: string, startTime: Date, endTime: Date) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      startTime,
      endTime,
      completed: false,
      notifiedStart: false,
      notifiedEnd: false,
      notifiedOverdue: false,
    };
    setTodos([...todos, newTodo]);
  };

  const toggleComplete = (id: string) => {
    setTodos(todos.map((todo: any) => {
      if (todo.id === id) {
        const isNowCompleted = !todo.completed;
        
        // If marking as completed, send notification
        if (isNowCompleted) {
          // Play completion sound
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Success sound: two tones
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          
          // Send browser notification if enabled
          if (notificationsEnabled) {
            new Notification('Task Completed! ✅', {
              body: `"${todo.title}" has been marked as complete`,
              icon: '/favicon.ico',
            });
          }
          
          // Show visual toast
          toast.success('✅ Task completed!', {
            description: `"${todo.title}" has been marked as complete`,
          });
        }
        
        return { ...todo, completed: isNowCompleted };
      }
      return todo;
    }));
  };

  const editTodo = (id: string, title: string, startTime: Date, endTime: Date) => {
    setTodos(todos.map((todo: any) => {
      if (todo.id === id) {
        // Reset notification flags if times have changed
        const timesChanged = 
          todo.startTime.getTime() !== startTime.getTime() ||
          todo.endTime.getTime() !== endTime.getTime();
        
        return {
          ...todo,
          title,
          startTime,
          endTime,
          // Reset notification flags if times changed
          notifiedStart: timesChanged ? false : todo.notifiedStart,
          notifiedEnd: timesChanged ? false : todo.notifiedEnd,
          notifiedOverdue: timesChanged ? false : todo.notifiedOverdue,
        };
      }
      return todo;
    }));
    
    toast.success('Task updated!', {
      description: `"${title}" has been updated`,
    });
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo: { id: string; }) => todo.id !== id));
  };

  const testNotification = () => {
    // Play a notification sound
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    if (notificationsEnabled) {
      // Send browser notification
      new Notification('Test Notification 🔔', {
        body: 'Notifications are working correctly!',
      });
      // Show visual toast
      toast.success('🔔 Test notification sent!', {
        description: 'Browser notifications are working correctly.',
      });
    } else {
      // Show warning toast
      toast.error('Notifications not enabled', {
        description: 'Please allow notifications in your browser settings.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-indigo-600" />
              <h1 className="text-indigo-900">Time-Based Todo App</h1>
            </div>
            <div className="flex items-center gap-2">
              {notificationsEnabled && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Bell className="w-4 h-4 fill-current" />
                  <span>Notifications On</span>
                </div>
              )}
              <Button
                onClick={testNotification}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Test
              </Button>
            </div>
          </div>

          <TodoForm onAddTodo={addTodo} />
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
          <h2 className="text-gray-800 mb-4">Your Tasks</h2>
          <TodoList
            todos={todos}
            onToggleComplete={toggleComplete}
            onDelete={deleteTodo}
            onEdit={editTodo}
          />
        </div>
      </div>
      <Toaster />
    </div>
  );
}