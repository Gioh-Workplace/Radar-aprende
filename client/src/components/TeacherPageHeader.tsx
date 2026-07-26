interface TeacherPageHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
  }
  
  export function TeacherPageHeader({
    eyebrow,
    title,
    description,
  }: TeacherPageHeaderProps) {
    return (
      <header className="teacher-page-header">
        <div>
          {eyebrow && (
            <span className="teacher-page-eyebrow">
              {eyebrow}
            </span>
          )}
  
          <h1>{title}</h1>
  
          {description && (
            <p>{description}</p>
          )}
        </div>
      </header>
    );
  }