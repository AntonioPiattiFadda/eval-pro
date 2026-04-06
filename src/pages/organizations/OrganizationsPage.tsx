import { LocationsGraph } from './components/LocationsGraph'

export function OrganizationsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Organización</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestioná las locations de tu organización
        </p>
      </div>
      <LocationsGraph />
    </div>
  )
}
