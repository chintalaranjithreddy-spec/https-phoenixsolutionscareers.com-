import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: string;
  due_date: string;
  created_at: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching tasks",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTasks(data || []);
  };

  const addTask = async () => {
    if (!newTask.trim()) {
      toast({
        title: "Task cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("tasks").insert({
      title: newTask,
      description: "",
      category: newCategory || "general",
      due_date: newDueDate || null,
      completed: false,
    });

    if (error) {
      toast({
        title: "Error adding task",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewTask("");
      setNewCategory("");
      setNewDueDate("");
      fetchTasks();
      toast({
        title: "Task added successfully!",
      });
    }
    setLoading(false);
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !completed })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchTasks();
      toast({
        title: "Task deleted",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: "bg-blue-500",
      personal: "bg-green-500",
      urgent: "bg-red-500",
      general: "bg-gray-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Task Manager Pro
          </h1>
          <p className="text-gray-600">Organize your life, one task at a time</p>
        </div>

        {/* Add Task Form */}
        <Card className="p-6 mb-8 shadow-lg">
          <div className="space-y-4">
            <Input
              placeholder="What needs to be done?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTask()}
              className="text-lg"
            />
            <div className="flex gap-4">
              <Input
                placeholder="Category (work, personal, urgent)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addTask} disabled={loading} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>
          </div>
        </Card>

        {/* Task Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.length}
            </div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter((t) => t.completed).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter((t) => !t.completed).length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p className="text-lg">No tasks yet. Add one to get started! 🚀</p>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card
                key={task.id}
                className={`p-4 transition-all hover:shadow-md ${
                  task.completed ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id, task.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`text-lg font-medium ${
                          task.completed
                            ? "line-through text-gray-500"
                            : "text-gray-800"
                        }`}
                      >
                        {task.title}
                      </h3>
                      <Badge className={getCategoryColor(task.category)}>
                        {task.category}
                      </Badge>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
