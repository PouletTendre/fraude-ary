import React from "react";
import {
  Card,
  CardHeader,
  CardLabel,
  CardTitle,
  CardCaption,
  CardContent,
} from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface EditorialCardProps {
  image?: string;
  imageAlt?: string;
  imageAspect?: "16:9" | "1:1" | "4:3";
  label?: string;
  title: string;
  caption?: string;
  children?: React.ReactNode;
  variant?: "default" | "cinematic";
  className?: string;
}

const aspectRatios: Record<string, string> = {
  "16:9": "56.25%",
  "1:1": "100%",
  "4:3": "75%",
};

export function EditorialCard({
  image,
  imageAlt = "",
  imageAspect = "16:9",
  label,
  title,
  caption,
  children,
  variant = "default",
  className,
}: EditorialCardProps) {
  return (
    <Card variant={variant} className={cn(className)}>
      {image && (
        <div
          style={{
            margin: "-20px -20px 20px -20px",
            position: "relative",
            paddingTop: aspectRatios[imageAspect],
            overflow: "hidden",
          }}
        >
          <img
            src={image}
            alt={imageAlt}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 0,
            }}
          />
        </div>
      )}
      <CardHeader>
        {label && <CardLabel>{label}</CardLabel>}
        <CardTitle>{title}</CardTitle>
        {caption && <CardCaption>{caption}</CardCaption>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
