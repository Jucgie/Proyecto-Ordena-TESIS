import styled from "styled-components";

interface Props{
    funcion?:()=>void;
    titulo?:React.ReactNode;
    background?:string;
    url?:string;
    color?:string;
}
interface CProps{
    $background?:string;
    $color?:string;
}

export function Btn ({funcion, titulo, background, url,color}:Props) {
    return(
        <Container type="button" onClick={funcion} $background={background}>
            <span className="btn" >
                <a href={url} target="_blank" style={{color}}>
                    {titulo}
                </a>
            </span>
        </Container>

    );
}

const Container = styled.button<CProps>`
    display:flex;
    border:none;
    background-color:initial;
    justify-content:center;
    gap:8px;
    align-items:center;
    padding:0px;
    .btn{
        background: ${(props)=>props.$background};
        padding:0.6em 0.8em;
        font-size:19px;
        border-radius:10px;
        cursor:pointer;

        a{
            display:flex;
            color:white;
            align-items:center;
        }

        &:hover{
        filter: saturate(0.6);
        transition:0.3s;        
    }

`