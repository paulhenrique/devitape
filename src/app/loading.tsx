export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    </div>
  );
}
