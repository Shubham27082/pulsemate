const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="text-5xl mb-4" role="img" aria-label={title}>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && action}
    </div>
  );
};

export default EmptyState;
