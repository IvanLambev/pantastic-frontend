import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function Team() {
  const teamMembers = [
    {
      id: 1,
      name: "John Smith",
      role: "Project Manager",
      email: "john.smith@example.com",
      avatar: "/team/john.jpg",
      status: "Active",
      projects: ["Restaurant Onboarding", "Menu Integration"]
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "UI/UX Designer",
      email: "sarah.j@example.com",
      avatar: "/team/sarah.jpg",
      status: "Active",
      projects: ["Mobile App Update"]
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "Developer",
      email: "michael.c@example.com",
      avatar: "/team/michael.jpg",
      status: "On Leave",
      projects: ["Menu Integration"]
    }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Team</h1>
      <div className="grid gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center gap-4 py-6">
              <Avatar className="h-16 w-16">
                <img
                  src={member.avatar}
                  alt={member.name}
                  onError={(e) => {
                    e.target.src = '/elementor-placeholder-image.webp'
                  }}
                />
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                  <Badge
                    className={member.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                  >
                    {member.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{member.email}</p>
                <div className="flex gap-2">
                  {member.projects.map((project) => (
                    <Badge key={project} variant="outline">
                      {project}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}