import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Projects() {
  const projects = [
    {
      id: 1,
      name: "New Restaurant Onboarding",
      status: "In Progress",
      progress: 75,
      dueDate: "2025-04-20",
      description: "Onboarding process for new restaurant partners in the downtown area"
    },
    {
      id: 2,
      name: "Menu Integration System",
      status: "Planning",
      progress: 30,
      dueDate: "2025-05-15",
      description: "Development of automated menu integration system for restaurant partners"
    },
    {
      id: 3,
      name: "Mobile App Update",
      status: "Review",
      progress: 90,
      dueDate: "2025-04-25",
      description: "Major update to the mobile app including new features and UI improvements"
    }
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'bg-blue-100 text-blue-800'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'review':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      <div className="grid gap-6">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">{project.description}</div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Progress:</span>
                  <div className="w-48 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span>{project.progress}%</span>
                </div>
                <div>
                  <span className="font-medium">Due: </span>
                  {new Date(project.dueDate).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}